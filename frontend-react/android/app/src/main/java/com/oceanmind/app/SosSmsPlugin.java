package com.oceanmind.app;

import android.Manifest;
import android.os.Build;
import android.telephony.SmsManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;

/**
 * Sends the SOS distress SMS directly via SmsManager — no composer round-trip,
 * so it works with the phone in a pocket once the fisher taps SOS.
 */
@CapacitorPlugin(
    name = "SosSms",
    permissions = @Permission(alias = "sms", strings = { Manifest.permission.SEND_SMS })
)
public class SosSmsPlugin extends Plugin {

    @PluginMethod
    public void send(PluginCall call) {
        if (getPermissionState("sms") != PermissionState.GRANTED) {
            requestPermissionForAlias("sms", call, "smsPermissionCallback");
            return;
        }
        doSend(call);
    }

    @PermissionCallback
    private void smsPermissionCallback(PluginCall call) {
        if (getPermissionState("sms") == PermissionState.GRANTED) {
            doSend(call);
        } else {
            call.reject("SMS permission denied", "PERMISSION_DENIED");
        }
    }

    private void doSend(PluginCall call) {
        String number = call.getString("number");
        String message = call.getString("message");
        if (number == null || number.isEmpty() || message == null || message.isEmpty()) {
            call.reject("number and message are required", "BAD_ARGS");
            return;
        }
        try {
            SmsManager sms;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                sms = getContext().getSystemService(SmsManager.class);
            } else {
                sms = SmsManager.getDefault();
            }
            ArrayList<String> parts = sms.divideMessage(message);
            sms.sendMultipartTextMessage(number, null, parts, null, null);
            JSObject ret = new JSObject();
            ret.put("sent", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to send SMS: " + e.getMessage(), "SEND_FAILED");
        }
    }
}
