package com.savindu.fitlock;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Enable edge-to-edge but let the web content handle safe areas
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}
