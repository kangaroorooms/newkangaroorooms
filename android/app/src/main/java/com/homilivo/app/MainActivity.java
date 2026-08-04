package com.homilivo.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebSettings;

import com.getcapacitor.BridgeActivity;
import com.ionicframework.capacitor.Checkout;

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    registerPlugin(Checkout.class);

    // Enable Chrome debugging
    WebView.setWebContentsDebuggingEnabled(true);

    // Allow HTTP requests from HTTPS WebView (mixed content)
    WebView webView = this.bridge.getWebView();
    WebSettings settings = webView.getSettings();
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
  }
}