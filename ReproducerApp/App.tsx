/**
 * Repro: ScrollView `automaticallyAdjustKeyboardInsets` ignores prop changes
 * made while the keyboard is visible (iOS, new architecture).
 *
 * The ScrollView only applies or removes its keyboard inset when a
 * `UIKeyboardWillChangeFrameNotification` arrives. Turning the prop on while
 * the keyboard is up gives no inset, and turning it off leaves the inset
 * behind for good.
 *
 * @format
 */

import { useEffect, useState } from 'react';
import {
  Button,
  Keyboard,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

const ROW_COUNT = 12;

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <Repro />
    </SafeAreaProvider>
  );
}

function Repro() {
  const insets = useSafeAreaInsets();
  const [adjust, setAdjust] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [insetBottom, setInsetBottom] = useState<number | null>(null);
  const [mount, setMount] = useState({ key: 0, autoFocus: false });

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', e =>
      setKeyboardHeight(Math.round(e.endCoordinates.height)),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardHeight(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.controls}>
        <View style={styles.row}>
          <Text style={styles.label}>automaticallyAdjustKeyboardInsets</Text>
          <Switch
            testID="adjust-switch"
            value={adjust}
            onValueChange={setAdjust}
          />
        </View>
        <Text testID="readout" style={styles.readout}>
          keyboard: {keyboardHeight} · contentInset.bottom: {insetBottom ?? '?'}{' '}
          (scroll to refresh)
        </Text>
        <Button
          testID="remount-button"
          title="Remount with autoFocus, enable in an effect"
          onPress={() => {
            setAdjust(false);
            setInsetBottom(null);
            setMount(m => ({ key: m.key + 1, autoFocus: true }));
          }}
        />
      </View>
      <Content
        key={mount.key}
        adjust={adjust}
        autoFocus={mount.autoFocus}
        onMount={mount.autoFocus ? () => setAdjust(true) : undefined}
        onInsetBottom={setInsetBottom}
      />
    </View>
  );
}

function Content({
  adjust,
  autoFocus,
  onMount,
  onInsetBottom,
}: {
  adjust: boolean;
  autoFocus: boolean;
  onMount?: () => void;
  onInsetBottom: (bottom: number) => void;
}) {
  /*
   * Mirrors a common real-world shape: the prop depends on state that only
   * settles after mount (here, an effect), while an autofocused input raises
   * the keyboard during mount.
   */
  useEffect(() => {
    onMount?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScrollView
      testID="scroll-view"
      style={styles.scrollView}
      automaticallyAdjustKeyboardInsets={adjust}
      keyboardShouldPersistTaps="handled"
      scrollEventThrottle={16}
      onScroll={e =>
        onInsetBottom(Math.round(e.nativeEvent.contentInset.bottom))
      }
    >
      {Array.from({ length: ROW_COUNT }, (_, i) => (
        <View key={i} style={styles.item}>
          <Text>Row {i + 1}</Text>
        </View>
      ))}
      <TextInput
        testID="input"
        autoFocus={autoFocus}
        placeholder="Tap to focus"
        style={styles.input}
      />
      <View testID="end-marker" style={styles.end}>
        <Text style={styles.endText}>End of content</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  controls: {
    gap: 8,
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#999',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: 'Menlo',
    fontSize: 13,
  },
  readout: {
    fontFamily: 'Menlo',
    fontSize: 12,
    color: '#555',
  },
  scrollView: {
    flex: 1,
  },
  item: {
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  input: {
    margin: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
  },
  end: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fde68a',
  },
  endText: {
    fontWeight: '600',
  },
});

export default App;
