package com.savindu.fitlock;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Register custom plugins before super.onCreate
        registerPlugin(InstalledAppsPlugin.class);
        registerPlugin(PermissionsPlugin.class);
        registerPlugin(AppLockServicePlugin.class);

        super.onCreate(savedInstanceState);

        // Get the WebView and inject the system navigation bar height as a CSS variable
        // This is needed because targetSdk 35+ enforces edge-to-edge and
        // env(safe-area-inset-bottom) doesn't work in Android WebView
        getBridge().getWebView().post(() -> {
            ViewCompat.setOnApplyWindowInsetsListener(getBridge().getWebView(), (v, windowInsets) -> {
                Insets navBarInsets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());

                // Convert physical pixels to CSS dp (density-independent pixels)
                float density = getResources().getDisplayMetrics().density;
                int bottomDp = Math.round(navBarInsets.bottom / density);
                int topDp = Math.round(navBarInsets.top / density);

                // Inject CSS variable into the WebView
                String js = "document.documentElement.style.setProperty('--nav-bar-height', '" + bottomDp + "px');"
                        + "document.documentElement.style.setProperty('--status-bar-height', '" + topDp + "px');";
                getBridge().getWebView().evaluateJavascript(js, null);

                return windowInsets;
            });

            // Trigger initial inset calculation
            ViewCompat.requestApplyInsets(getBridge().getWebView());
        });
    }
}
