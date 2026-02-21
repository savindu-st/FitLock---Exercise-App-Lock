package com.savindu.fitlock;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Register custom plugins before super.onCreate
        registerPlugin(InstalledAppsPlugin.class);

        super.onCreate(savedInstanceState);
    }
}
