package com.savindu.fitlock;

import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;

import java.io.ByteArrayOutputStream;
import java.util.List;

@CapacitorPlugin(name = "InstalledApps")
public class InstalledAppsPlugin extends Plugin {

    private static final int ICON_SIZE = 144;

    @PluginMethod
    public void getApps(PluginCall call) {
        try {
            PackageManager pm = getActivity().getPackageManager();
            List<ApplicationInfo> packages = pm.getInstalledApplications(PackageManager.GET_META_DATA);
            JSArray appsArray = new JSArray();

            for (ApplicationInfo appInfo : packages) {
                // Only include apps that have a launcher intent (user-visible apps)
                Intent launchIntent = pm.getLaunchIntentForPackage(appInfo.packageName);
                if (launchIntent == null)
                    continue;

                JSObject appObj = new JSObject();
                appObj.put("name", pm.getApplicationLabel(appInfo).toString());
                appObj.put("packageName", appInfo.packageName);

                appsArray.put(appObj);
            }

            JSObject result = new JSObject();
            result.put("apps", appsArray);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to get installed apps: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getAppIcon(PluginCall call) {
        String packageName = call.getString("packageName");
        if (packageName == null) {
            call.reject("Must provide a packageName");
            return;
        }

        try {
            String iconBase64 = encodeIconForPackage(packageName);
            JSObject result = new JSObject();
            result.put("icon", iconBase64);
            call.resolve(result);
        } catch (Exception e) {
            JSObject result = new JSObject();
            result.put("icon", "");
            call.resolve(result);
        }
    }

    @PluginMethod
    public void getAppIcons(PluginCall call) {
        try {
            JSONArray packageNames = call.getArray("packageNames");
            if (packageNames == null) {
                call.reject("Must provide packageNames array");
                return;
            }

            JSObject icons = new JSObject();
            for (int i = 0; i < packageNames.length(); i++) {
                String pkg = packageNames.getString(i);
                try {
                    String iconBase64 = encodeIconForPackage(pkg);
                    icons.put(pkg, iconBase64);
                } catch (Exception e) {
                    icons.put(pkg, "");
                }
            }

            JSObject result = new JSObject();
            result.put("icons", icons);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to get app icons: " + e.getMessage());
        }
    }

    private String encodeIconForPackage(String packageName) throws Exception {
        PackageManager pm = getActivity().getPackageManager();
        ApplicationInfo appInfo = pm.getApplicationInfo(packageName, 0);
        Drawable icon = pm.getApplicationIcon(appInfo);
        Bitmap bitmap = getBitmapFromDrawable(icon);
        Bitmap scaled = Bitmap.createScaledBitmap(bitmap, ICON_SIZE, ICON_SIZE, true);
        ByteArrayOutputStream stream = new ByteArrayOutputStream();
        scaled.compress(Bitmap.CompressFormat.PNG, 100, stream);
        String base64 = Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP);

        if (bitmap != scaled)
            bitmap.recycle();
        scaled.recycle();

        return "data:image/png;base64," + base64;
    }

    private static Bitmap getBitmapFromDrawable(Drawable drawable) {
        int width = drawable.getIntrinsicWidth();
        int height = drawable.getIntrinsicHeight();
        if (width <= 0)
            width = ICON_SIZE;
        if (height <= 0)
            height = ICON_SIZE;
        Bitmap bmp = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bmp);
        drawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
        drawable.draw(canvas);
        return bmp;
    }
}
