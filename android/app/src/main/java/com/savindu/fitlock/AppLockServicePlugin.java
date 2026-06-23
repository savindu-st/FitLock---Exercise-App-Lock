package com.savindu.fitlock;

import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashSet;
import java.util.Set;

@CapacitorPlugin(name = "AppLockService")
public class AppLockServicePlugin extends Plugin {

    private static final String PREFS_NAME = "fitlock_native_prefs";
    private static final String KEY_LOCKED_APPS = "locked_apps_json";
    private static final String KEY_TEMP_UNLOCKED = "temp_unlocked_apps";

    // Static pending challenge so MainActivity can set it before Capacitor
    // initializes
    public static Intent pendingChallenge;

    @PluginMethod
    public void startService(PluginCall call) {
        try {
            Intent intent = new Intent(getContext(), AppMonitorService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(intent);
            } else {
                getContext().startService(intent);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to start service: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopService(PluginCall call) {
        try {
            Intent intent = new Intent(getContext(), AppMonitorService.class);
            getContext().stopService(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to stop service: " + e.getMessage());
        }
    }

    @PluginMethod
    public void isServiceRunning(PluginCall call) {
        JSObject result = new JSObject();
        result.put("running", isServiceActive());
        call.resolve(result);
    }

    @PluginMethod
    public void updateLockedApps(PluginCall call) {
        try {
            String appsJson = call.getString("apps", "[]");
            SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putString(KEY_LOCKED_APPS, appsJson).apply();
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to update locked apps: " + e.getMessage());
        }
    }

    @PluginMethod
    public void addTempUnlock(PluginCall call) {
        try {
            String packageName = call.getString("packageName", "");
            if (packageName.isEmpty()) {
                call.reject("packageName is required");
                return;
            }

            SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            Set<String> tempUnlocked = new HashSet<>(
                    prefs.getStringSet(KEY_TEMP_UNLOCKED, new HashSet<>()));
            tempUnlocked.add(packageName);
            
            SharedPreferences.Editor editor = prefs.edit();
            editor.putStringSet(KEY_TEMP_UNLOCKED, tempUnlocked);
            
            // Clear any existing expiration for this package
            try {
                String expirationsJson = prefs.getString("temp_unlocked_expirations", "{}");
                JSONObject expirations = new JSONObject(expirationsJson);
                if (expirations.has(packageName)) {
                    expirations.remove(packageName);
                    editor.putString("temp_unlocked_expirations", expirations.toString());
                }
            } catch (Exception e) {
                // Ignore json errors
            }
            
            editor.apply();
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to add temp unlock: " + e.getMessage());
        }
    }

    @PluginMethod
    public void clearTempUnlocks(PluginCall call) {
        try {
            SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit()
                 .putStringSet(KEY_TEMP_UNLOCKED, new HashSet<>())
                 .putString("temp_unlocked_expirations", "{}")
                 .apply();
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to clear temp unlocks: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getPendingChallenge(PluginCall call) {
        JSObject result = new JSObject();
        if (pendingChallenge != null) {
            result.put("action", pendingChallenge.getStringExtra("action"));
            result.put("locked_package", pendingChallenge.getStringExtra("locked_package"));
            result.put("locked_app_name", pendingChallenge.getStringExtra("locked_app_name"));
            result.put("required_reps", pendingChallenge.getIntExtra("required_reps", 5));
            // Clear it so it only fires once
            pendingChallenge = null;
            result.put("hasChallenge", true);
        } else {
            result.put("hasChallenge", false);
        }
        call.resolve(result);
    }

    @PluginMethod
    public void exitToApp(PluginCall call) {
        try {
            String packageName = call.getString("packageName", "");

            // If they provided a package name, try to launch it
            if (!packageName.isEmpty()) {
                Intent launchIntent = getContext().getPackageManager().getLaunchIntentForPackage(packageName);
                if (launchIntent != null) {
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    getContext().startActivity(launchIntent);
                }
            } else {
                // No package provided means we explicitly just want to go Home
                Intent homeIntent = new Intent(Intent.ACTION_MAIN);
                homeIntent.addCategory(Intent.CATEGORY_HOME);
                homeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(homeIntent);
            }

            // Let the system manage the activity stack naturally.
            // DO NOT call finish() so the WebView does not get killed, avoiding
            // white-screen bugs on return.

            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to exit to app: " + e.getMessage());
        }
    }

    private boolean isServiceActive() {
        ActivityManager am = (ActivityManager) getContext().getSystemService(Context.ACTIVITY_SERVICE);
        if (am == null)
            return false;
        for (ActivityManager.RunningServiceInfo service : am.getRunningServices(Integer.MAX_VALUE)) {
            if (AppMonitorService.class.getName().equals(service.service.getClassName())) {
                return true;
            }
        }
        return false;
    }
}
