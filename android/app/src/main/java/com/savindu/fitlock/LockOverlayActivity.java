package com.savindu.fitlock;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

public class LockOverlayActivity extends Activity {

    private String lockedPackage = "";
    private String lockedAppName = "";
    private int requiredReps = 5;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_lock_overlay);

        // Get extras from intent
        Intent intent = getIntent();
        updateFromIntent(intent);

        setupUI();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        updateFromIntent(intent);
        setupUI();
    }

    private void updateFromIntent(Intent intent) {
        if (intent != null) {
            lockedPackage = intent.getStringExtra("locked_package");
            lockedAppName = intent.getStringExtra("locked_app_name");
            requiredReps = intent.getIntExtra("required_reps", 5);
            if (lockedPackage == null)
                lockedPackage = "";
            if (lockedAppName == null)
                lockedAppName = "App";
        }
    }

    private void setupUI() {
        // Set up UI
        TextView titleText = findViewById(R.id.lockTitle);
        TextView subtitleText = findViewById(R.id.lockSubtitle);
        TextView repsText = findViewById(R.id.lockRepsInfo);
        Button unlockBtn = findViewById(R.id.btnCompleteExercise);
        Button goBackBtn = findViewById(R.id.btnGoBack);

        titleText.setText(lockedAppName + " is Locked");
        subtitleText.setText("Complete an exercise challenge to unlock this app");
        repsText.setText(requiredReps + " reps required");

        // "Complete Exercise" → open FitLock main activity with lock challenge
        unlockBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent mainIntent = new Intent(LockOverlayActivity.this, MainActivity.class);
                mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                mainIntent.putExtra("action", "lock_challenge");
                mainIntent.putExtra("locked_package", lockedPackage);
                mainIntent.putExtra("locked_app_name", lockedAppName);
                mainIntent.putExtra("required_reps", requiredReps);
                startActivity(mainIntent);
                finish();
            }
        });

        // "Go Back" → send user to home screen
        goBackBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent homeIntent = new Intent(Intent.ACTION_MAIN);
                homeIntent.addCategory(Intent.CATEGORY_HOME);
                homeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(homeIntent);
                finish();
            }
        });
    }

    @Override
    public void onBackPressed() {
        // Send user to home screen instead of back to the locked app
        Intent homeIntent = new Intent(Intent.ACTION_MAIN);
        homeIntent.addCategory(Intent.CATEGORY_HOME);
        homeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(homeIntent);
        finish();
    }
}
