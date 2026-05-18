import { colors, fonts, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MethodMeta = {
  name: string;
  image: number;
  virtualAccount: string;
};

const methodMetaMap: Record<string, MethodMeta> = {
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

const paymentSteps = [
  "Buka aplikasi bank atau ATM",
  "Pilih Transfer Virtual Account",
  "Masukkan nomor di atas",
  "Konfirmasi pembayaran",
];

export default function DetailTransferScreen(): React.JSX.Element {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const planName = (params.planName as string) || "Dueday Premium 1 Bulan";
  const planPrice = (params.planPrice as string) || "Rp20.000";
  const methodId = ((params.methodId as string) || "bca").toLowerCase();
  const methodNameParam = params.methodName as string | undefined;

  const methodMeta = useMemo(() => {
    const fallback = methodMetaMap.bca;
    const selected = methodMetaMap[methodId] ?? fallback;

    return {
      ...selected,
      name: methodNameParam || selected.name,
    };
  }, [methodId, methodNameParam]);

  const [copyLabel, setCopyLabel] = useState("Salin");

  return (
    <View style={[styles.root, { paddingTop: top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.primaryContainer} />
        </Pressable>
        <Text style={styles.headerTitle}>Detail Transfer</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottom + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.planCard}>
          <Text style={styles.deadlineText}>Bayar sebelum: 23:59:00</Text>
          <View style={styles.planRow}>
            <Text style={styles.planName}>{planName}</Text>
            <Text style={styles.planPrice}>{planPrice}</Text>
          </View>
        </View>

        <View style={styles.methodCard}>
          <View style={styles.methodTopRow}>
            <Image source={methodMeta.image} style={styles.methodLogo} resizeMode="contain" />
            <View style={styles.methodTag}>
              <Text style={styles.methodTagText}>VIRTUAL ACCOUNT</Text>
            </View>
          </View>

          <Text style={styles.methodLabel}>Nomor Virtual Account</Text>

          <View style={styles.vaRow}>
            <View>
              <Text style={styles.vaNumber}>{methodMeta.virtualAccount}</Text>
              <Text style={styles.vaMerchant}>Dueday Studio</Text>
            </View>
            <Pressable
              style={styles.copyButton}
              onPress={() => setCopyLabel("Disalin")}
              accessibilityRole="button"
            >
              <Text style={styles.copyText}>{copyLabel}</Text>
              <Ionicons name="copy-outline" size={14} color={colors.primaryContainer} />
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Petunjuk Pembayaran</Text>
        <View style={styles.stepsList}>
          {paymentSteps.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <View style={styles.stepNumberWrap}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footerActions}>
          <Pressable
            style={styles.confirmButton}
            accessibilityRole="button"
            onPress={() =>
              // `replace` (not push): the user must not be able to go back to
              // the VA / transfer screen after paying. Keep as replace.
              router.replace({
                pathname: "/payment-success",
                params: {
                  planName,
                  planPrice,
                  methodName: methodMeta.name,
                },
              })
            }
          >
            <Text style={styles.confirmButtonText}>Konfirmasi Pembayaran</Text>
          </Pressable>

          <Pressable
            style={styles.cancelButton}
            accessibilityRole="button"
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Batal</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },
  header: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainer,
    paddingHorizontal: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: typography.h3.fontSize,
    fontFamily: fonts["700"],
    color: colors.onSurface,
  },
  headerSpacer: {
    width: 36,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  planCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
    backgroundColor: colors.surfaceContainerLowest,
    padding: 12,
    marginBottom: 10,
  },
  deadlineText: {
    fontSize: 12,
    fontFamily: fonts["500"],
    color: colors.primaryContainer,
    marginBottom: 8,
  },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planName: {
    fontSize: 14,
    fontFamily: fonts["500"],
    color: colors.onSurface,
  },
  planPrice: {
    fontSize: 16,
    fontFamily: fonts["700"],
    color: colors.primaryContainer,
  },
  methodCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
    backgroundColor: colors.surfaceContainerLowest,
    padding: 12,
    marginBottom: 14,
  },
  methodTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  methodLogo: {
    width: 68,
    height: 24,
  },
  methodTag: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.surfaceWarm,
  },
  methodTagText: {
    fontSize: 10,
    fontFamily: fonts["600"],
    color: colors.primaryContainer,
  },
  methodLabel: {
    fontSize: 13,
    fontFamily: fonts["500"],
    color: colors.onSurfaceVariant,
    marginBottom: 8,
  },
  vaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  vaNumber: {
    fontSize: 20,
    fontFamily: fonts["700"],
    color: colors.onSurface,
  },
  vaMerchant: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: fonts["500"],
    color: colors.onSurfaceVariant,
  },
  copyButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  copyText: {
    fontSize: 12,
    fontFamily: fonts["600"],
    color: colors.primaryContainer,
  },
  sectionTitle: {
    marginBottom: 10,
    fontSize: 14,
    fontFamily: fonts["600"],
    color: colors.onSurface,
  },
  stepsList: {
    gap: 8,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  stepNumberWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surfaceWarm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNumber: {
    fontSize: 11,
    fontFamily: fonts["700"],
    color: colors.primaryContainer,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fonts["500"],
    color: colors.onSurface,
  },
  footerActions: {
    marginTop: 22,
    gap: 10,
  },
  confirmButton: {
    height: 48,
    borderRadius: 999,
    backgroundColor: colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    fontSize: 14,
    fontFamily: fonts["700"],
    color: colors.onPrimary,
  },
  cancelButton: {
    height: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.errorStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: fonts["600"],
    color: colors.errorStrong,
  },
});