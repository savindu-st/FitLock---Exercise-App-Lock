package com.savindu.fitlock;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class AppMonitorService extends Service {

    private static final String TAG = "AppMonitorService";
    private static final String CHANNEL_ID = "fitlock_monitor_v3";
    private static final int NOTIFICATION_ID = 1001;
    private static final long POLL_INTERVAL_MS = 500;
    private static final String PREFS_NAME = "fitlock_native_prefs";
    private static final String KEY_LOCKED_APPS = "locked_apps_json";
    private static final String KEY_TEMP_UNLOCKED = "temp_unlocked_apps";

    private Handler handler;
    private Runnable pollRunnable;
    private String lastForegroundPackage = "";
    private boolean isRunning = false;

    // Cache for locked apps to avoid JSON parsing in the polling loop
    private Set<String> lockedPackagesCache = new HashSet<>();
    private SharedPreferences.OnSharedPreferenceChangeListener prefsListener;

    @Override
    public void onCreate() {
        super.onCreate();
        handler = new Handler(Looper.getMainLooper());
        createNotificationChannel();
        
        // Initialize cache and listener
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        updateLockedAppsCache(prefs);
        
        prefsListener = (sharedPreferences, key) -> {
            if (KEY_LOCKED_APPS.equals(key)) {
                updateLockedAppsCache(sharedPreferences);
            }
        };
        prefs.registerOnSharedPreferenceChangeListener(prefsListener);
    }

    private void updateLockedAppsCache(SharedPreferences prefs) {
        try {
            String json = prefs.getString(KEY_LOCKED_APPS, "[]");
            JSONArray apps = new JSONArray(json);
            Set<String> newCache = new HashSet<>();
            for (int i = 0; i < apps.length(); i++) {
                newCache.add(apps.getJSONObject(i).getString("packageName"));
            }
            lockedPackagesCache = newCache;
            Log.d(TAG, "Locked apps cache updated: " + lockedPackagesCache.size() + " apps");
        } catch (Exception e) {
            Log.e(TAG, "Error updating locked apps cache", e);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Service starting...");

        // Start as foreground service
        try {
            if (Build.VERSION.SDK_INT >= 34) { // Build.VERSION_CODES.UPSIDE_DOWN_CAKE
                startForeground(NOTIFICATION_ID, buildNotification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            } else {
                startForeground(NOTIFICATION_ID, buildNotification());
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to start foreground service: " + e.getMessage());
        }

        if (!isRunning) {
            isRunning = true;
            startPolling();
        }

        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        isRunning = false;
        if (handler != null && pollRunnable != null) {
            handler.removeCallbacks(pollRunnable);
        }
        Log.d(TAG, "Service destroyed");
    }

    private void startPolling() {
        pollRunnable = new Runnable() {
            @Override
            public void run() {
                if (!isRunning)
                    return;

                String foregroundPkg = getForegroundPackage();
                if (foregroundPkg != null) {
                    if (!foregroundPkg.equals(lastForegroundPackage)) {
                        Log.d(TAG, "Foreground app changed: " + lastForegroundPackage + " -> " + foregroundPkg);
                        lastForegroundPackage = foregroundPkg;
                        onForegroundAppChanged(foregroundPkg);
                    }
                } else {
                    // Reset if no app detected in the window - this ensures we catch re-entry
                    // into the same app if the transition was missed.
                    lastForegroundPackage = "";
                }

                handler.postDelayed(this, POLL_INTERVAL_MS);
            }
        };
        handler.post(pollRunnable);
    }

    private String getForegroundPackage() {
        try {
            UsageStatsManager usm = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
            if (usm == null)
                return null;

            long now = System.currentTimeMillis();
            // Query usage events for the last 10 seconds (increased from 5 for robustness)
            UsageEvents events = usm.queryEvents(now - 10000, now);
            if (events == null)
                return null;

            String lastApp = null;
            UsageEvents.Event event = new UsageEvents.Event();
            while (events.hasNextEvent()) {
                events.getNextEvent(event);
                if (event.getEventType() == UsageEvents.Event.ACTIVITY_RESUMED) {
                    lastApp = event.getPackageName();
                } else if (event.getEventType() == UsageEvents.Event.ACTIVITY_PAUSED || 
                           event.getEventType() == UsageEvents.Event.ACTIVITY_STOPPED) {
                    if (event.getPackageName().equals(lastApp)) {
                        lastApp = null;
                    }
                }
            }
            
            // Fallback: If queryEvents is empty or inconclusive, use queryUsageStats
            if (lastApp == null) {
                List<UsageStats> stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, now - 1000 * 60, now);
                if (stats != null && !stats.isEmpty()) {
                    UsageStats bestStat = null;
                    for (UsageStats s : stats) {
                        if (bestStat == null || s.getLastTimeUsed() > bestStat.getLastTimeUsed()) {
                            bestStat = s;
                        }
                    }
                    // Only use it if it was used very recently (last 5 seconds)
                    if (bestStat != null && (now - bestStat.getLastTimeUsed()) < 5000) {
                        lastApp = bestStat.getPackageName();
                    }
                }
            }
            
            return lastApp;
        } catch (Exception e) {
            Log.e(TAG, "Error getting foreground package", e);
            return null;
        }
    }

    private void onForegroundAppChanged(String packageName) {
        // Don't block ourselves
        if (packageName.equals(getPackageName()))
            return;

        // Automatically relock apps if we switch away from a temporarily unlocked app
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        Set<String> tempUnlocked = prefs.getStringSet(KEY_TEMP_UNLOCKED, new HashSet<>());
        if (!tempUnlocked.isEmpty() && !tempUnlocked.contains(packageName)) {
            Log.d(TAG, "User switched away from unlocked app. Clearing temporary unlocks.");
            prefs.edit().putStringSet(KEY_TEMP_UNLOCKED, new HashSet<>()).apply();
        }

        // Check if the app is locked using cache (fast)
        if (!lockedPackagesCache.contains(packageName))
            return;

        // Check if temporarily unlocked
        if (isTempUnlocked(packageName))
            return;

        Log.d(TAG, "Locked app detected: " + packageName);

        // Launch lock overlay
        Intent lockIntent = new Intent(this, LockOverlayActivity.class);
        lockIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        lockIntent.putExtra("locked_package", packageName);
        lockIntent.putExtra("locked_app_name", getLockedAppName(packageName));
        lockIntent.putExtra("required_reps", getRequiredReps(packageName));
        startActivity(lockIntent);
    }

    private boolean isAppLocked(String packageName) {
        return lockedPackagesCache.contains(packageName);
    }

    private String getLockedAppName(String packageName) {
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
            String json = prefs.getString(KEY_LOCKED_APPS, "[]");
            JSONArray apps = new JSONArray(json);
            for (int i = 0; i < apps.length(); i++) {
                JSONObject app = apps.getJSONObject(i);
                if (app.getString("packageName").equals(packageName)) {
                    return app.optString("name", packageName);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting app name", e);
        }
        return packageName;
    }

    private int getRequiredReps(String packageName) {
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
            String json = prefs.getString(KEY_LOCKED_APPS, "[]");
            JSONArray apps = new JSONArray(json);
            for (int i = 0; i < apps.length(); i++) {
                JSONObject app = apps.getJSONObject(i);
                if (app.getString("packageName").equals(packageName)) {
                    return app.optInt("requiredReps", 5);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting required reps", e);
        }
        return 5;
    }

    private boolean isTempUnlocked(String packageName) {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        Set<String> tempUnlocked = prefs.getStringSet(KEY_TEMP_UNLOCKED, new HashSet<>());
        return tempUnlocked.contains(packageName);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "FitLock Monitor",
                    NotificationManager.IMPORTANCE_HIGH); // Changed to HIGH
            channel.setDescription("FitLock is protecting your apps");
            channel.setShowBadge(false);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildNotification() {
        Intent notifIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, notifIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("FitLock Active")
                .setContentText("Protecting your apps — exercise to unlock!")
                .setSmallIcon(R.drawable.ic_notification_lock)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH) // Changed to HIGH
                .build();
    }
}
