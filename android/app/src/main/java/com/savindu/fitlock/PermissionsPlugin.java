package com.savindu.fitlock;

import android.Manifest;
import android.app.AppOpsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

@CapacitorPlugin(name = "PermissionsPlugin", permissions = {
        @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notifications"),
        @Permission(strings = { Manifest.permission.CAMERA }, alias = "camera")
})
public class PermissionsPlugin extends Plugin {

    // ── Overlay (Display over other apps) ──────────────────────────

    @PluginMethod
    public void checkOverlayPermission(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", Settings.canDrawOverlays(getContext()));
        call.resolve(result);
    }

    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        try {
            Intent intent = new Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to open overlay settings: " + e.getMessage());
        }
    }

    // ── Usage Access ───────────────────────────────────────────────

    @PluginMethod
    public void checkUsageAccessPermission(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", hasUsageStatsPermission());
        call.resolve(result);
    }

    @PluginMethod
    public void requestUsageAccessPermission(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to open usage access settings: " + e.getMessage());
        }
    }

    // ── Camera ─────────────────────────────────────────────────────

    @PluginMethod
    public void checkCameraPermission(PluginCall call) {
        JSObject result = new JSObject();
        boolean granted = ContextCompat.checkSelfPermission(
                getContext(), Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
        result.put("granted", granted);
        call.resolve(result);
    }

    @PluginMethod
    public void requestCameraPermission(PluginCall call) {
        try {
            ActivityCompat.requestPermissions(
                    getActivity(),
                    new String[] { Manifest.permission.CAMERA },
                    1001);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to request camera permission: " + e.getMessage());
        }
    }

    // ── Notifications (Android 13+) ────────────────────────────────

    @PluginMethod
    public void checkNotificationPermission(PluginCall call) {
        JSObject result = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            boolean granted = ContextCompat.checkSelfPermission(
                    getContext(), Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
            result.put("granted", granted);
        } else {
            // Below Android 13, notifications are allowed by default
            result.put("granted", true);
        }
        call.resolve(result);
    }

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                ActivityCompat.requestPermissions(
                        getActivity(),
                        new String[] { Manifest.permission.POST_NOTIFICATIONS },
                        1002);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to request notification permission: " + e.getMessage());
        }
    }

    // ── Battery Optimization ───────────────────────────────────────

    @PluginMethod
    public void checkBatteryOptimizationPermission(PluginCall call) {
        JSObject result = new JSObject();
        PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            result.put("granted", pm.isIgnoringBatteryOptimizations(getContext().getPackageName()));
        } else {
            result.put("granted", true);
        }
        call.resolve(result);
    }

    @PluginMethod
    public void requestBatteryOptimizationPermission(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to request battery optimization exemption: " + e.getMessage());
        }
    }

    // ── Open App Settings (fallback) ───────────────────────────────

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to open app settings: " + e.getMessage());
        }
    }

    // ── Helper ─────────────────────────────────────────────────────

    private boolean hasUsageStatsPermission() {
        try {
            AppOpsManager appOps = (AppOpsManager) getContext().getSystemService(Context.APP_OPS_SERVICE);
            int mode = appOps.checkOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    android.os.Process.myUid(),
                    getContext().getPackageName());
            return mode == AppOpsManager.MODE_ALLOWED;
        } catch (Exception e) {
            return false;
        }
    }
}
