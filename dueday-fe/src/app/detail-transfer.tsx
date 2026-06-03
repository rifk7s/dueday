import { apiFetch } from "@/api/client";
import type { Payment } from "@/api/payments";
import { getMe } from "@/api/users";
import { API_BASE_URL } from "@/auth/api";
import { useSession } from "@/auth/ctx";
import { colors, fonts, typography } from "@/constants/theme";
import { exitFlowTo } from "@/constants/navigation";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
// Legacy `Camera` class is kept for `Camera.scanFromURLAsync` (QR-from-image).
// SDK 54's `CameraView` does NOT expose this — only live-stream barcode scanning
// via `onBarcodeScanned`. Migrate when Expo provides a replacement.
import { Camera } from "expo-camera";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MethodMeta = {
  name: string;
  image: number;
  virtualAccount: string;
};

const methodMetaMap: Record<string, MethodMeta> = {
  qris: {
    name: "QRIS",
    image: require("../../assets/images/gopay.jpg"),
    virtualAccount: "QRIS_INTEROPERABLE",
  },
  bca: {
    name: "BCA",
    image: require("../../assets/images/BCA.jpg"),
    virtualAccount: "1234567890",
  },
  mandiri: {
    name: "Mandiri",
    image: require("../../assets/images/mandiri.jpg"),
    virtualAccount: "2234567890",
  },
  gopay: {
    name: "GoPay",
    image: require("../../assets/images/gopay.jpg"),
    virtualAccount: "3234567890",
  },
  dana: {
    name: "Dana",
    image: require("../../assets/images/dana.jpg"),
    virtualAccount: "4234567890",
  },
  ovo: {
    name: "OVO",
    image: require("../../assets/images/ovo.jpg"),
    virtualAccount: "5234567890",
  },
};

type PaymentStatus = Payment["status"] | "unknown";

function getStatusMeta(status: PaymentStatus, t: TFunction): { title: string; description: string; color: string } {
  switch (status) {
    case "pending":
      return { title: t("detailTransfer.statusPendingTitle"), description: t("detailTransfer.statusPendingDesc"), color: colors.secondaryContainer };
    case "paid":
      return { title: t("detailTransfer.statusPaidTitle"), description: t("detailTransfer.statusPaidDesc"), color: colors.success };
    case "failed":
      return { title: t("detailTransfer.statusFailedTitle"), description: t("detailTransfer.statusFailedDesc"), color: colors.error };
    default:
      return { title: t("detailTransfer.statusUnknownTitle"), description: t("detailTransfer.statusUnknownDesc"), color: colors.primaryContainer };
  }
}

export default function DetailTransferScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const { token, setUser } = useSession();
  const qc = useQueryClient();
  const { top, bottom } = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const planName = (params.planName as string) || "Dueday Premium 1 Bulan";
  const planPrice = (params.planPrice as string) || "Rp20.000";
  const planAmount = Number(params.planAmount || "0");
  // Forwarded straight through to /payment-rejected so its "Coba Lagi" can
  // replace back into /payment with the original plan selection intact.
  const plan = params.plan as string | undefined;
  const planDuration = params.planDuration as string | undefined;
  const mode = params.mode as string | undefined;
  const methodId = ((params.methodId as string) || "bca").toLowerCase();
  const methodType = (params.methodType as "VA" | "QRIS") || (methodId === "qris" ? "QRIS" : "VA");
  const methodNameParam = params.methodName as string | undefined;
  const paymentId = params.paymentId as string | undefined;
  const initialPaymentStatus = (params.paymentStatus as PaymentStatus) || "unknown";

  const methodMeta = useMemo(() => {
    const fallback = methodMetaMap.bca;
    const selected = methodMetaMap[methodId] ?? fallback;
    return {
      ...selected,
      name: methodNameParam || selected.name,
    };
  }, [methodId, methodNameParam]);

  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(initialPaymentStatus);
  const hasNavigatedToSuccess = useRef(false);
  const hasNavigatedToRejected = useRef(false);

  const goQrApiUrl = useMemo(() => {
    const rawQrisData = `DUEDAY_MOCK_PAYMENT|MERCHANT:DUEDAY STUDIO|CITY:MAKASSAR|AMOUNT:${planAmount}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(rawQrisData)}&margin=10`;
  }, [planAmount]);

  const refreshPaymentStatus = useCallback(
    async (options?: { notify?: boolean }) => {
      const notify = options?.notify ?? false;

      if (!paymentId || !token) {
        if (notify) {
          const info = getStatusMeta(paymentStatus, t);
          Alert.alert(info.title, info.description);
        }
        return;
      }

      if (notify) setRefreshing(true);

      try {
        const payment = await apiFetch<Payment>(`/payments/${paymentId}`, token);
        setPaymentStatus(payment.status);
        if (notify && payment.status !== "paid") {
          const info = getStatusMeta(payment.status, t);
          Alert.alert(info.title, info.description);
        }
      } catch {
        if (notify) {
          Alert.alert(
            t("detailTransfer.checkFailedTitle"),
            t("detailTransfer.checkFailedBody")
          );
        }
      } finally {
        if (notify) setRefreshing(false);
      }
    },
    [paymentId, token, paymentStatus, t]
  );

  useEffect(() => {
    void refreshPaymentStatus();

    const isTerminal = paymentStatus === "paid" || paymentStatus === "failed";

    if (!paymentId || !token || isTerminal) return;

    const intervalId = setInterval(() => {
      void refreshPaymentStatus();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [paymentId, token, paymentStatus, refreshPaymentStatus]);

  useEffect(() => {
    if (paymentStatus !== "paid" || hasNavigatedToSuccess.current) return;

    hasNavigatedToSuccess.current = true;
    getMe(token)
      .then((user) => {
        setUser?.(user);
        qc.setQueryData(["current-user"], user);
      })
      .catch(() => {});
    qc.invalidateQueries({ queryKey: ["current-user"] });
    router.replace({
      pathname: "/payment-success",
      params: { planName, planPrice, methodName: methodMeta.name },
    });
  }, [methodMeta.name, paymentStatus, planName, planPrice, router, token, setUser, qc]);

  useEffect(() => {
    if (paymentStatus !== "failed" || hasNavigatedToRejected.current) return;

    hasNavigatedToRejected.current = true;
    router.replace({
      pathname: "/payment-rejected",
      params: {
        planName,
        planPrice,
        methodName: methodMeta.name,
        // Forwarded so the rejected screen's "Coba Lagi" can re-enter /payment
        // with the original selection (falls back to defaults if missing).
        ...(plan ? { plan } : {}),
        ...(planDuration ? { planDuration } : {}),
        ...(mode ? { mode } : {}),
        planAmount: String(planAmount),
        methodId,
      },
    });
  }, [
    paymentStatus,
    planName,
    planPrice,
    methodMeta.name,
    plan,
    planDuration,
    mode,
    planAmount,
    methodId,
    router,
  ]);

  const handleCopyVA = async () => {
    await Clipboard.setStringAsync(methodMeta.virtualAccount);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCancelPayment = useCallback(async () => {
    if (isCancelling) return;

    if (!paymentId || !token) {
      exitFlowTo("/profile");
      return;
    }

    setIsCancelling(true);

    try {
      await apiFetch<void>(`/payments/${paymentId}`, token, {
        method: "DELETE",
      });
      exitFlowTo("/profile");
    } catch {
      Alert.alert(t("detailTransfer.cancelFailedTitle"), t("detailTransfer.tryAgain"));
    } finally {
      setIsCancelling(false);
    }
  }, [isCancelling, paymentId, token, t]);

  const sendDecodedDataToBackend = async (scannedString: string) => {
    // Update the existing payment status to paid directly!
    const targetUrl = `${API_BASE_URL}/payments/${paymentId}`; 
    const response = await fetch(targetUrl, {
      method: "PUT", // or PATCH depending on your API routing
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        status: "paid",
      }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || t("detailTransfer.updateStatusFailed"));
    return result;
  };

  const handleSelectAndScanQRIS = async () => {
    // ================== WEB BROWSER MODE ==================
    if (Platform.OS === "web") {
      try {
        const mockString = `DUEDAY_MOCK_PAYMENT|MERCHANT:DUEDAY STUDIO|CITY:MAKASSAR|AMOUNT:${planAmount}`;
        setIsUploading(true);
        await sendDecodedDataToBackend(mockString);
        alert(t("detailTransfer.webVerifySuccess"));
        setPaymentStatus("paid");
        return;
      } catch (error: any) {
        alert(t("detailTransfer.webVerifyFailed") + error.message);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    // ================== NATIVE PHONE DEVICE FLOW ==================
    try {
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!mediaPermission.granted) {
        Alert.alert(t("detailTransfer.galleryDeniedTitle"), t("detailTransfer.galleryDeniedBody"));
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (pickerResult.canceled || !pickerResult.assets?.[0]) {
        return;
      }

      const selectedImgUri = pickerResult.assets[0].uri;

      // A valid screenshot is in hand — only now show the verifying overlay,
      // covering the scan + backend call (not the permission prompt or picker).
      setIsUploading(true);

      // Scan code directly on device using native hardware capabilities
      const scanResults = await Camera.scanFromURLAsync(selectedImgUri, ["qr"]);

      if (!scanResults || scanResults.length === 0) {
        Alert.alert(t("detailTransfer.qrReadFailedTitle"), t("detailTransfer.qrReadFailedBody"));
        return;
      }

      const nativeScannedString = scanResults[0].data;

      // Send the decoded text output directly to backend
      await sendDecodedDataToBackend(nativeScannedString);

      // Defer the status flip (which navigates to /payment-success) until the user
      // taps OK. Alert.alert is non-blocking on native, so setting it inline would
      // tear this screen down mid-alert and leave the OK button unresponsive.
      Alert.alert(t("common.success"), t("detailTransfer.verifiedByServer"), [
        { text: t("common.ok"), onPress: () => setPaymentStatus("paid") },
      ]);
    } catch (error: any) {
      Alert.alert(t("detailTransfer.verifyFailedTitle"), error.message || t("detailTransfer.systemError"));
    } finally {
      setIsUploading(false);
    }
  };

  const paymentStatusInfo = getStatusMeta(paymentStatus, t);

  return (
    <View style={[styles.root, { paddingTop: top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable style={styles.backButton} accessibilityRole="button" accessibilityLabel={t("common.back")} onPress={() => exitFlowTo("/profile")}>
          <Ionicons name="arrow-back" size={22} color={colors.primaryContainer} />
        </Pressable>
        <Text style={styles.headerTitle}>{t("detailTransfer.title")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: bottom + 16 }]} showsVerticalScrollIndicator={false}>
        
        <View style={styles.planCard}>
          <Text style={styles.deadlineText}>{t("detailTransfer.payBefore")}</Text>
          <View style={styles.planRow}>
            <Text style={styles.planName}>{planName}</Text>
            <Text style={styles.planPrice}>{planPrice}</Text>
          </View>
        </View>

        <View style={[styles.statusCard, { borderColor: paymentStatusInfo.color }]}>
          <Text style={[styles.statusTitle, { color: paymentStatusInfo.color }]}>{paymentStatusInfo.title}</Text>
          <Text style={styles.statusDescription}>{paymentStatusInfo.description}</Text>
          {paymentId && <Text style={styles.statusHint}>{t("detailTransfer.paymentId", { id: paymentId })}</Text>}
        </View>

        {methodType === "QRIS" ? (
          <View style={styles.qrisCard}>
            <View style={styles.qrisHeader}>
              <Text style={styles.qrisBrand}>QRIS</Text>
              <Text style={styles.qrisInteroperable}>{t("detailTransfer.sandboxAutoScan")}</Text>
            </View>
            <View style={styles.qrWrapper}>
              <Image source={{ uri: goQrApiUrl }} style={styles.qrImage} resizeMode="contain" />
            </View>
            <Text style={styles.merchantTitle}>DUEDAY STUDIO</Text>
            <Text style={styles.merchantNmid}>NMID: ID_SANDBOX_MOCK</Text>
            <View style={styles.qrisFooterAccent} />
          </View>
        ) : (
          <View style={styles.methodCard}>
            <View style={styles.methodTopRow}>
              <Image source={methodMeta.image} style={styles.methodLogo} resizeMode="contain" />
              <View style={styles.methodTag}>
                <Text style={styles.methodTagText}>{t("detailTransfer.virtualAccountTag")}</Text>
              </View>
            </View>
            <Text style={styles.methodLabel}>{t("detailTransfer.vaLabel")}</Text>
            <View style={styles.vaRow}>
              <View>
                <Text style={styles.vaNumber}>{methodMeta.virtualAccount}</Text>
                <Text style={styles.vaMerchant}>Dueday Studio</Text>
              </View>
              <Pressable style={styles.copyButton} onPress={handleCopyVA} accessibilityRole="button">
                <Text style={styles.copyText}>{copied ? t("detailTransfer.copied") : t("detailTransfer.copy")}</Text>
                <Ionicons name="copy-outline" size={14} color={colors.primaryContainer} />
              </Pressable>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>{t("detailTransfer.instructions")}</Text>
        <View style={styles.stepsList}>
          {(methodType === "QRIS"
            ? [
                Platform.OS === "web" ? t("detailTransfer.qrisWeb1") : t("detailTransfer.qrisNative1"),
                Platform.OS === "web" ? t("detailTransfer.qrisWeb2") : t("detailTransfer.qrisNative2"),
                Platform.OS === "web" ? t("detailTransfer.qrisWeb3") : t("detailTransfer.qrisNative3"),
                t("detailTransfer.qrisStep4"),
              ]
            : [
                t("detailTransfer.va1"),
                t("detailTransfer.va2"),
                t("detailTransfer.va3"),
                t("detailTransfer.va4"),
              ]
          ).map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <View style={styles.stepNumberWrap}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footerActions}>
          {methodType === "QRIS" && (
            <Pressable 
              style={[styles.confirmButton, { backgroundColor: colors.success, marginBottom: 4 }]} 
              onPress={handleSelectAndScanQRIS}
              disabled={isUploading}
            >
              <Text style={styles.confirmButtonText}>
                {isUploading ? t("detailTransfer.verifyingImage") : t("detailTransfer.uploadQris")}
              </Text>
            </Pressable>
          )}

          <Pressable style={styles.confirmButton} accessibilityRole="button" onPress={() => void refreshPaymentStatus({ notify: true })} disabled={refreshing}>
            <Text style={styles.confirmButtonText}>
              {refreshing ? t("detailTransfer.checkingStatus") : t("detailTransfer.checkStatus")}
            </Text>
          </Pressable>

          <Pressable style={styles.cancelButton} accessibilityRole="button" onPress={() => void handleCancelPayment()} disabled={isCancelling}>
            <Text style={styles.cancelButtonText}>{isCancelling ? t("detailTransfer.cancelling") : t("detailTransfer.cancelPayment")}</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* In-tree overlay (not a Modal): a Modal can't present right after the image
          picker dismisses on iOS, so the loading state was getting dropped there. */}
      {isUploading ? (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primaryContainer} />
            <Text style={styles.loadingTitle}>{t("detailTransfer.verifyingTitle")}</Text>
            <Text style={styles.loadingText}>{t("detailTransfer.verifyingBody")}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surfaceContainerLowest },
  header: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.surfaceContainer, paddingHorizontal: 10 },
  backButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: typography.h3.fontSize, fontFamily: fonts["700"], color: colors.onSurface },
  headerSpacer: { width: 36 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 14, paddingTop: 12 },
  planCard: { borderRadius: 12, borderWidth: 1, borderColor: colors.surfaceContainer, backgroundColor: colors.surfaceContainerLowest, padding: 12, marginBottom: 10 },
  deadlineText: { fontSize: 12, fontFamily: fonts["500"], color: colors.primaryContainer, marginBottom: 8 },
  planRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  planName: { fontSize: 14, fontFamily: fonts["500"], color: colors.onSurface },
  planPrice: { fontSize: 16, fontFamily: fonts["700"], color: colors.primaryContainer },
  statusCard: { borderRadius: 12, borderWidth: 1, backgroundColor: colors.surfaceContainerLowest, padding: 12, marginBottom: 10 },
  statusTitle: { fontSize: 15, fontFamily: fonts["700"], marginBottom: 4 },
  statusDescription: { fontSize: 13, fontFamily: fonts["500"], color: colors.onSurfaceVariant },
  statusHint: { marginTop: 6, fontSize: 12, fontFamily: fonts["400"], color: colors.onSurfaceVariant },
  methodCard: { borderRadius: 12, borderWidth: 1, borderColor: colors.surfaceContainer, backgroundColor: colors.surfaceContainerLowest, padding: 12, marginBottom: 14 },
  methodTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  methodLogo: { width: 68, height: 24 },
  methodTag: { borderRadius: 999, borderWidth: 1, borderColor: colors.primaryContainer, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: colors.surfaceWarm },
  methodTagText: { fontSize: 10, fontFamily: fonts["600"], color: colors.primaryContainer },
  methodLabel: { fontSize: 13, fontFamily: fonts["500"], color: colors.onSurfaceVariant, marginBottom: 8 },
  vaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  vaNumber: { fontSize: 20, fontFamily: fonts["700"], color: colors.onSurface },
  vaMerchant: { marginTop: 2, fontSize: 12, fontFamily: fonts["500"], color: colors.onSurfaceVariant },
  copyButton: { borderRadius: 999, borderWidth: 1, borderColor: colors.primaryContainer, paddingHorizontal: 10, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 4 },
  copyText: { fontSize: 12, fontFamily: fonts["600"], color: colors.primaryContainer },
  qrisCard: { borderRadius: 16, borderWidth: 2, borderColor: "#231f20", backgroundColor: "#fff", padding: 16, alignItems: "center", marginBottom: 14 },
  qrisHeader: { width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, borderBottomWidth: 1, borderBottomColor: "#eee", paddingBottom: 6 },
  qrisBrand: { fontSize: 24, fontWeight: "900", fontStyle: "italic", color: "#231f20" },
  qrisInteroperable: { fontSize: 11, fontWeight: "700", color: "#666" },
  qrWrapper: { padding: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#ddd", borderRadius: 8, marginTop: 2 },
  qrImage: { width: 200, height: 200 },
  merchantTitle: { fontSize: 16, fontFamily: fonts["700"], color: "#231f20", marginTop: 10 },
  merchantNmid: { fontSize: 11, fontFamily: fonts["500"], color: "#666", marginTop: 2 },
  qrisFooterAccent: { width: "100%", height: 6, backgroundColor: colors.success, borderRadius: 99, marginTop: 12 },
  sectionTitle: { marginBottom: 10, fontSize: 14, fontFamily: fonts["600"], color: colors.onSurface },
  stepsList: { gap: 8 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  stepNumberWrap: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.surfaceWarm, alignItems: "center", justifyContent: "center", marginTop: 1 },
  stepNumber: { fontSize: 11, fontFamily: fonts["700"], color: colors.primaryContainer },
  stepText: { flex: 1, fontSize: 14, lineHeight: 21, fontFamily: fonts["500"], color: colors.onSurface },
  footerActions: { marginTop: 22, gap: 10 },
  confirmButton: { height: 48, borderRadius: 999, backgroundColor: colors.primaryContainer, alignItems: "center", justifyContent: "center" },
  confirmButtonText: { fontSize: 14, fontFamily: fonts["700"], color: colors.onPrimary },
  cancelButton: { height: 46, borderRadius: 999, borderWidth: 1, borderColor: colors.errorStrong, alignItems: "center", justifyContent: "center" },
  cancelButtonText: { fontSize: 14, fontFamily: fonts["600"], color: colors.errorStrong },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(12, 16, 24, 0.48)", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 20, elevation: 20 },
  loadingCard: { width: "100%", maxWidth: 320, borderRadius: 20, backgroundColor: colors.surfaceContainerLowest, padding: 24, alignItems: "center", gap: 12 },
  loadingTitle: { fontSize: 18, fontFamily: fonts["700"], color: colors.onSurface, textAlign: "center" },
  loadingText: { fontSize: 13, fontFamily: fonts["500"], color: colors.onSurfaceVariant, textAlign: "center", lineHeight: 20 },
});