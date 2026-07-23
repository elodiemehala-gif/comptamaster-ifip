package fr.elodie.comptamasterifip;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

public final class MainActivity extends Activity {
    private static final String APP_ORIGIN = "https://app.local";
    private static final String START_URL = APP_ORIGIN + "/index.html";
    private static final int MICROPHONE_PERMISSION_REQUEST = 71;
    private static final String UTTERANCE_ID = "comptamaster-course";

    private WebView webView;
    private TextToSpeech textToSpeech;
    private boolean textToSpeechReady;
    private String voiceLabel = "Voix française Android hors connexion";
    private SpeechRecognizer speechRecognizer;
    private boolean pendingDictationPermission;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);
        configureWebView();
        initializeTextToSpeech();
        webView.loadUrl(START_URL);
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setDatabaseEnabled(false);
        settings.setGeolocationEnabled(false);

        WebView.setWebContentsDebuggingEnabled(false);
        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");
        webView.setWebViewClient(new LocalOnlyWebViewClient());
    }

    private boolean isLocalUrl(String rawUrl) {
        if (rawUrl == null) return false;
        Uri uri = Uri.parse(rawUrl);
        return "https".equals(uri.getScheme()) && "app.local".equals(uri.getHost());
    }

    private WebResourceResponse localResponse(Uri uri) {
        String path = uri.getPath();
        if (path == null || "/".equals(path)) path = "/index.html";
        path = path.startsWith("/") ? path.substring(1) : path;
        if (path.contains("..")) return errorResponse(403, "Forbidden");

        try {
            InputStream stream = getAssets().open("public/" + path);
            String mime = mimeType(path);
            String encoding = mime.startsWith("text/") || mime.contains("javascript") || mime.contains("json")
                ? StandardCharsets.UTF_8.name()
                : null;
            Map<String, String> headers = new HashMap<>();
            headers.put("Cache-Control", "no-store");
            headers.put("X-Content-Type-Options", "nosniff");
            return new WebResourceResponse(mime, encoding, 200, "OK", headers, stream);
        } catch (IOException exception) {
            return errorResponse(404, "Not Found");
        }
    }

    private WebResourceResponse errorResponse(int status, String reason) {
        Map<String, String> headers = new HashMap<>();
        headers.put("Cache-Control", "no-store");
        return new WebResourceResponse(
            "text/plain",
            StandardCharsets.UTF_8.name(),
            status,
            reason,
            headers,
            new ByteArrayInputStream(reason.getBytes(StandardCharsets.UTF_8))
        );
    }

    private String mimeType(String path) {
        String lower = path.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".html")) return "text/html";
        if (lower.endsWith(".css")) return "text/css";
        if (lower.endsWith(".js")) return "text/javascript";
        if (lower.endsWith(".json")) return "application/json";
        if (lower.endsWith(".webmanifest")) return "application/manifest+json";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".png")) return "image/png";
        return "application/octet-stream";
    }

    private final class LocalOnlyWebViewClient extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if ("app.local".equals(uri.getHost())) return localResponse(uri);
            return errorResponse(403, "External access blocked");
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return !isLocalUrl(request.getUrl().toString());
        }

        @Override
        @SuppressWarnings("deprecation")
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return !isLocalUrl(url);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            if (textToSpeechReady) callJs("onTtsReady", voiceLabel);
        }
    }

    private void initializeTextToSpeech() {
        textToSpeech = new TextToSpeech(this, status -> {
            if (status != TextToSpeech.SUCCESS) {
                callJs("onSpeechError", "La voix Android n’a pas pu démarrer.");
                return;
            }

            textToSpeech.setLanguage(Locale.FRANCE);
            Voice selected = bestOfflineFrenchVoice(textToSpeech.getVoices());
            if (selected != null) {
                textToSpeech.setVoice(selected);
                voiceLabel = selected.getName() + " · français hors connexion";
            }
            textToSpeech.setPitch(1f);
            textToSpeech.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String utteranceId) { }

                @Override
                public void onDone(String utteranceId) {
                    if (UTTERANCE_ID.equals(utteranceId)) callJs("onSpeechEnd");
                }

                @Override
                public void onError(String utteranceId) {
                    if (UTTERANCE_ID.equals(utteranceId)) {
                        callJs("onSpeechError", "La lecture vocale hors connexion a été interrompue.");
                    }
                }
            });
            textToSpeechReady = true;
            callJs("onTtsReady", voiceLabel);
        });
    }

    private Voice bestOfflineFrenchVoice(Set<Voice> voices) {
        if (voices == null) return null;
        Voice best = null;
        for (Voice voice : voices) {
            if (!voice.getLocale().getLanguage().equals(Locale.FRENCH.getLanguage())) continue;
            if (voice.isNetworkConnectionRequired()) continue;
            if (best == null || voice.getQuality() > best.getQuality()) best = voice;
        }
        return best;
    }

    private void speak(String text, float rate) {
        if (!textToSpeechReady || text == null || text.isBlank()) {
            callJs("onSpeechError", "Installe une voix française hors connexion dans les réglages Android.");
            return;
        }
        textToSpeech.setSpeechRate(Math.max(0.6f, Math.min(rate, 1.5f)));
        textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, null, UTTERANCE_ID);
    }

    private void startDictationAfterPermission() {
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            pendingDictationPermission = true;
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, MICROPHONE_PERMISSION_REQUEST);
            return;
        }
        startOfflineDictation();
    }

    private void startOfflineDictation() {
        destroySpeechRecognizer();
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                && SpeechRecognizer.isOnDeviceRecognitionAvailable(this)) {
                speechRecognizer = SpeechRecognizer.createOnDeviceSpeechRecognizer(this);
            } else {
                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this);
            }
        } catch (RuntimeException exception) {
            callJs("onDictationError", "La reconnaissance vocale hors connexion n’est pas installée sur ce téléphone.");
            return;
        }

        speechRecognizer.setRecognitionListener(new RecognitionListener() {
            @Override public void onReadyForSpeech(Bundle params) { callJs("onDictationReady"); }
            @Override public void onBeginningOfSpeech() { }
            @Override public void onRmsChanged(float rmsdB) { }
            @Override public void onBufferReceived(byte[] buffer) { }
            @Override public void onEndOfSpeech() { }

            @Override
            public void onError(int error) {
                callJs("onDictationError", dictationErrorMessage(error));
                destroySpeechRecognizer();
            }

            @Override
            public void onResults(Bundle results) {
                callJs("onDictationFinal", bestTranscript(results));
                destroySpeechRecognizer();
            }

            @Override
            public void onPartialResults(Bundle partialResults) {
                callJs("onDictationPartial", bestTranscript(partialResults));
            }

            @Override public void onEvent(int eventType, Bundle params) { }
        });

        android.content.Intent intent = new android.content.Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "fr-FR");
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        intent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true);
        speechRecognizer.startListening(intent);
    }

    private String bestTranscript(Bundle results) {
        ArrayList<String> values = results == null
            ? null
            : results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        return values == null || values.isEmpty() ? "" : values.get(0);
    }

    private String dictationErrorMessage(int error) {
        if (error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS) {
            return "Autorise le micro dans les réglages Android pour utiliser la récitation.";
        }
        if (error == SpeechRecognizer.ERROR_NO_MATCH) {
            return "Je n’ai pas reconnu la phrase. Réessaie plus lentement ou écris la réponse.";
        }
        if (error == SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED
            || error == SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE) {
            return "Télécharge le français hors connexion dans les réglages de reconnaissance vocale Android.";
        }
        return "La dictée hors connexion a été interrompue. Tu peux la reprendre ou écrire la réponse.";
    }

    private void stopDictation() {
        if (speechRecognizer != null) speechRecognizer.stopListening();
    }

    private void destroySpeechRecognizer() {
        if (speechRecognizer == null) return;
        speechRecognizer.destroy();
        speechRecognizer = null;
    }

    private void callJs(String callback, String... arguments) {
        if (webView == null) return;
        StringBuilder script = new StringBuilder("window.ComptaNative && window.ComptaNative.")
            .append(callback)
            .append("(");
        for (int index = 0; index < arguments.length; index += 1) {
            if (index > 0) script.append(",");
            script.append(JSONObject.quote(arguments[index] == null ? "" : arguments[index]));
        }
        script.append(");");
        webView.post(() -> webView.evaluateJavascript(script.toString(), null));
    }

    private final class AndroidBridge {
        @JavascriptInterface
        public void speak(String text, float rate) {
            runOnUiThread(() -> MainActivity.this.speak(text, rate));
        }

        @JavascriptInterface
        public void stopSpeech() {
            runOnUiThread(() -> {
                if (textToSpeech != null) textToSpeech.stop();
            });
        }

        @JavascriptInterface
        public String getVoiceLabel() {
            return voiceLabel;
        }

        @JavascriptInterface
        public void startDictation() {
            runOnUiThread(MainActivity.this::startDictationAfterPermission);
        }

        @JavascriptInterface
        public void stopDictation() {
            runOnUiThread(MainActivity.this::stopDictation);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != MICROPHONE_PERMISSION_REQUEST || !pendingDictationPermission) return;
        pendingDictationPermission = false;
        if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            startOfflineDictation();
        } else {
            callJs("onDictationError", "Le micro est refusé. Tu peux toujours écrire la définition.");
        }
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        destroySpeechRecognizer();
        if (textToSpeech != null) {
            textToSpeech.stop();
            textToSpeech.shutdown();
        }
        if (webView != null) {
            webView.removeJavascriptInterface("AndroidBridge");
            webView.destroy();
        }
        super.onDestroy();
    }
}
