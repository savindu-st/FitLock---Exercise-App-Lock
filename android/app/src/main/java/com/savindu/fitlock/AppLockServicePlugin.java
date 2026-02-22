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
            prefs.edit().putStringSet(KEY_TEMP_UNLOCKED, tempUnlocked).apply();
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to add temp unlock: " + e.getMessage());
        }
    }

    @PluginMethod
    public void clearTempUnlocks(PluginCall call) {
        try {
            SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putStringSet(KEY_TEMP_UNLOCKED, new HashSet<>()).apply();
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to clear temp unlocks: " + e.getMessage());
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
