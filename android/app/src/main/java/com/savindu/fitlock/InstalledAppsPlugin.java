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

                // We don't fetch icon here anymore to speed up load times
                // Icons are fetched lazily via getAppIcon()

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
            PackageManager pm = getActivity().getPackageManager();
            ApplicationInfo appInfo = pm.getApplicationInfo(packageName, 0);

            Drawable icon = pm.getApplicationIcon(appInfo);
            Bitmap bitmap = getBitmapFromDrawable(icon);
            // Scale down to 144x144 to retain higher quality on HD displays
            Bitmap scaled = Bitmap.createScaledBitmap(bitmap, 144, 144, true);
            ByteArrayOutputStream stream = new ByteArrayOutputStream();
            scaled.compress(Bitmap.CompressFormat.PNG, 100, stream);
            String base64 = Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP);
            JSObject result = new JSObject();
            result.put("icon", "data:image/png;base64," + base64);

            if (bitmap != scaled)
                bitmap.recycle();
            scaled.recycle();

            call.resolve(result);
        } catch (Exception e) {
            JSObject result = new JSObject();
            result.put("icon", "");
            call.resolve(result);
        }
    }

    private static Bitmap getBitmapFromDrawable(Drawable drawable) {
        int width = drawable.getIntrinsicWidth();
        int height = drawable.getIntrinsicHeight();
        if (width <= 0)
            width = 144;
        if (height <= 0)
            height = 144;
        Bitmap bmp = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bmp);
        drawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
        drawable.draw(canvas);
        return bmp;
    }
}
