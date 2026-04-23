import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';

const SHEET_MAX_LIFT = 48;
const SHEET_MIN_LIFT = 0;
const SHEET_SNAP_THRESHOLD = 24;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const sheetLift = useRef(new Animated.Value(SHEET_MIN_LIFT)).current;
  const sheetOffset = useRef(SHEET_MIN_LIFT);

  const bottomSectionMarginTop = useMemo(
    () =>
      sheetLift.interpolate({
        inputRange: [SHEET_MIN_LIFT, SHEET_MAX_LIFT],
        outputRange: [-34, -34 - SHEET_MAX_LIFT],
      }),
    [sheetLift],
  );

  const topSectionHeight = useMemo(
    () =>
      sheetLift.interpolate({
        inputRange: [SHEET_MIN_LIFT, SHEET_MAX_LIFT],
        outputRange: [350, 334],
      }),
    [sheetLift],
  );

  const topSectionPaddingBottom = useMemo(
    () =>
      sheetLift.interpolate({
        inputRange: [SHEET_MIN_LIFT, SHEET_MAX_LIFT],
        outputRange: [50, 40],
      }),
    [sheetLift],
  );

  const heroTranslateY = useMemo(
    () =>
      sheetLift.interpolate({
        inputRange: [SHEET_MIN_LIFT, SHEET_MAX_LIFT],
        outputRange: [0, -10],
      }),
    [sheetLift],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 4,
        onPanResponderGrant: () => {
          sheetLift.stopAnimation((value) => {
            sheetOffset.current = value;
          });
        },
        onPanResponderMove: (_, gestureState) => {
          const nextValue = clamp(sheetOffset.current - gestureState.dy, SHEET_MIN_LIFT, SHEET_MAX_LIFT);
          sheetLift.setValue(nextValue);
        },
        onPanResponderRelease: (_, gestureState) => {
          const releasedValue = clamp(sheetOffset.current - gestureState.dy, SHEET_MIN_LIFT, SHEET_MAX_LIFT);
          const snapTo = releasedValue > SHEET_SNAP_THRESHOLD ? SHEET_MAX_LIFT : SHEET_MIN_LIFT;

          Animated.spring(sheetLift, {
            toValue: snapTo,
            useNativeDriver: false,
            tension: 100,
            friction: 14,
          }).start(() => {
            sheetOffset.current = snapTo;
          });
        },
      }),
    [sheetLift],
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.shell}>
          <Animated.View
            style={[styles.topSection, { height: topSectionHeight, paddingBottom: topSectionPaddingBottom }]}>
            <View style={styles.glow} />

            <Animated.View style={{ alignItems: 'center', transform: [{ translateY: heroTranslateY }] }}>
              <View style={styles.logoCircle}>
                <MaterialCommunityIcons name="school-outline" size={28} color="#ffffff" />
              </View>

              <Text style={styles.brandTitle}>Dueday</Text>
              <Text style={styles.brandSubtitle}>Reminder Tugas Kampusmu</Text>
            </Animated.View>
          </Animated.View>

          <Animated.View
            {...panResponder.panHandlers}
            style={[styles.bottomSection, { marginTop: bottomSectionMarginTop }]}>
            <View style={styles.handleDragArea}>
              <View style={styles.handle} />
            </View>

            <Text style={styles.heading}>Masuk</Text>
            <Text style={styles.subheading}>Selamat datang! Masukkan detail akunmu.</Text>

            <View style={styles.formSection}>
              <Text style={styles.label}>Email UC</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name="email-outline"
                  size={18}
                  color="#70564a"
                  style={styles.leftIcon}
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@student.ciputra.ac.id"
                  placeholderTextColor="rgba(88, 66, 55, 0.5)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Kata Sandi</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={18}
                  color="#70564a"
                  style={styles.leftIcon}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Kata sandi"
                  placeholderTextColor="rgba(88, 66, 55, 0.5)"
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.input, styles.passwordInput]}
                />
                <Pressable
                  onPress={() => setIsPasswordVisible((current) => !current)}
                  hitSlop={8}
                  style={styles.rightIconButton}>
                  <MaterialCommunityIcons
                    name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#70564a"
                  />
                </Pressable>
              </View>
            </View>

            <Pressable style={styles.loginButton} onPress={() => router.replace('/(tabs)')}>
              <Text style={styles.loginButtonText}>Masuk</Text>
            </Pressable>

            <Pressable style={styles.forgotButton}>
              <Text style={styles.forgotText}>Lupa Kata Sandi?</Text>
            </Pressable>

            <Text style={styles.footerText}>Gunakan akun UC SSO kamu</Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f97316',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f97316',
  },
  shell: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    backgroundColor: '#f3f1f0',
  },
  topSection: {
    height: 350,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 50,
    overflow: 'hidden',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: 18,
    opacity: 0.8,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
    marginBottom: 16,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 24,
    lineHeight: 32,
    fontFamily: Fonts.sans,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: Fonts.sans,
    fontWeight: '300',
    textAlign: 'center',
    maxWidth: 220,
  },
  bottomSection: {
    marginTop: -34,
    flex: 1,
    backgroundColor: '#f3f1f0',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 26,
  },
  handle: {
    width: 48,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#d9e3f4',
    alignSelf: 'center',
  },
  handleDragArea: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    marginBottom: 20,
  },
  heading: {
    color: '#121c28',
    fontSize: 32,
    lineHeight: 38,
    fontFamily: Fonts.sans,
    fontWeight: '700',
  },
  subheading: {
    marginTop: 8,
    color: '#584237',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: Fonts.sans,
    fontWeight: '400',
    marginBottom: 22,
  },
  formSection: {
    marginBottom: 16,
  },
  label: {
    color: '#121c28',
    fontSize: 12,
    lineHeight: 12,
    fontFamily: Fonts.sans,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#e0c0b1',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f1f0',
    paddingLeft: 14,
    paddingRight: 14,
  },
  leftIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#584237',
    fontSize: 14,
    fontFamily: Fonts.sans,
    fontWeight: '400',
    paddingVertical: 0,
  },
  passwordInput: {
    paddingRight: 10,
  },
  rightIconButton: {
    padding: 4,
  },
  loginButton: {
    marginTop: 14,
    height: 56,
    borderRadius: 999,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 5,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 16,
    fontFamily: Fonts.sans,
    fontWeight: '600',
  },
  forgotButton: {
    marginTop: 28,
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  forgotText: {
    color: '#f97316',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: Fonts.sans,
    fontWeight: '500',
  },
  footerText: {
    marginTop: 'auto',
    textAlign: 'center',
    color: '#584237',
    opacity: 0.95,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.sans,
    fontWeight: '300',
  },
});
