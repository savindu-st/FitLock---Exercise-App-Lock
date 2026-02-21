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

import java.io.ByteArrayOutputStream;
import java.util.List;

@CapacitorPlugin(name = "InstalledApps")
public class InstalledAppsPlugin extends Plugin {

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

                // Get icon as base64
                try {
                    Drawable icon = pm.getApplicationIcon(appInfo.packageName);
                    Bitmap bitmap = getBitmapFromDrawable(icon);
                    // Scale down to 48x48 to reduce memory
                    Bitmap scaled = Bitmap.createScaledBitmap(bitmap, 48, 48, true);
                    ByteArrayOutputStream stream = new ByteArrayOutputStream();
                    scaled.compress(Bitmap.CompressFormat.PNG, 80, stream);
                    String base64 = Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP);
                    appObj.put("icon", "data:image/png;base64," + base64);
                    if (bitmap != scaled)
                        bitmap.recycle();
                    scaled.recycle();
                } catch (Exception e) {
                    appObj.put("icon", "");
                }

                appsArray.put(appObj);
            }

            JSObject result = new JSObject();
            result.put("apps", appsArray);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to get installed apps: " + e.getMessage());
        }
    }

    private static Bitmap getBitmapFromDrawable(Drawable drawable) {
        int width = drawable.getIntrinsicWidth();
        int height = drawable.getIntrinsicHeight();
        if (width <= 0)
            width = 48;
        if (height <= 0)
            height = 48;
        Bitmap bmp = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bmp);
        drawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
        drawable.draw(canvas);
        return bmp;
    }
}
