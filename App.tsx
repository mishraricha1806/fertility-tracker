import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type Tab = 'home' | 'log' | 'calendar' | 'insights' | 'settings';
type Phase = 'Period' | 'Fertile' | 'Ovulation' | 'Regular';
type Flow = 'None' | 'Spotting' | 'Light' | 'Medium' | 'Heavy';
type Mood = 'Calm' | 'Happy' | 'Sensitive' | 'Stressed' | 'Low';
type Mucus = 'Dry' | 'Sticky' | 'Creamy' | 'Watery' | 'Egg white';
type TestResult = 'Not tested' | 'Negative' | 'Positive';
type Symptom = 'Cramps' | 'Tender breasts' | 'Bloating' | 'Headache' | 'Fatigue' | 'Acne';

type DayLog = {
  date: string;
  flow: Flow;
  mood: Mood;
  mucus: Mucus;
  temperature: string;
  ovulationTest: TestResult;
  pregnancyTest: TestResult;
  intercourse: boolean;
  symptoms: Symptom[];
  note: string;
};

type Settings = {
  age: number;
  cycleLength: number;
  heightCm: string;
  takingPrenatal: boolean;
  tryingMonths: number;
  weightKg: string;
  periodLength: number;
  lutealLength: number;
  fertileReminder: boolean;
  periodReminder: boolean;
  privacyLock: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = 'fertility-tracker:v1';
const PIN_KEY = 'fertility-tracker:pin';
const symptoms: Symptom[] = ['Cramps', 'Tender breasts', 'Bloating', 'Headache', 'Fatigue', 'Acne'];
const flows: Flow[] = ['None', 'Spotting', 'Light', 'Medium', 'Heavy'];
const moods: Mood[] = ['Calm', 'Happy', 'Sensitive', 'Stressed', 'Low'];
const mucusOptions: Mucus[] = ['Dry', 'Sticky', 'Creamy', 'Watery', 'Egg white'];
const testResults: TestResult[] = ['Not tested', 'Negative', 'Positive'];
const defaultSettings: Settings = {
  age: 30,
  cycleLength: 28,
  heightCm: '165',
  takingPrenatal: false,
  tryingMonths: 3,
  weightKg: '62',
  periodLength: 5,
  lutealLength: 14,
  fertileReminder: true,
  periodReminder: true,
  privacyLock: false,
};

const today = new Date();
const todayISO = toISODate(today);
const initialPeriodStart = addDays(today, -9);

const seedLogs: DayLog[] = [
  {
    date: toISODate(addDays(today, -9)),
    flow: 'Medium',
    mood: 'Sensitive',
    mucus: 'Dry',
    temperature: '97.6',
    ovulationTest: 'Not tested',
    pregnancyTest: 'Not tested',
    intercourse: false,
    symptoms: ['Cramps', 'Fatigue'],
    note: 'Period started in the morning.',
  },
  {
    date: toISODate(addDays(today, -8)),
    flow: 'Heavy',
    mood: 'Low',
    mucus: 'Dry',
    temperature: '97.4',
    ovulationTest: 'Not tested',
    pregnancyTest: 'Not tested',
    intercourse: false,
    symptoms: ['Cramps', 'Headache'],
    note: 'Needed rest and hydration.',
  },
  {
    date: todayISO,
    flow: 'None',
    mood: 'Calm',
    mucus: 'Creamy',
    temperature: '97.9',
    ovulationTest: 'Negative',
    pregnancyTest: 'Not tested',
    intercourse: false,
    symptoms: ['Fatigue'],
    note: 'Light cramps this morning.',
  },
];

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function fromISODate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function daysBetween(start: Date, end: Date) {
  return Math.floor(
    (Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
      Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) /
      DAY_MS,
  );
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatFullDate(value: string) {
  return fromISODate(value).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function calculateBmi(heightCm: string, weightKg: string) {
  const height = Number(heightCm);
  const weight = Number(weightKg);
  if (!height || !weight || height < 100 || weight < 30) {
    return null;
  }
  const meters = height / 100;
  return weight / (meters * meters);
}

function getBmiCategory(bmi: number | null) {
  if (bmi === null) {
    return 'Add height and weight';
  }
  if (bmi < 18.5) {
    return 'Underweight';
  }
  if (bmi < 25) {
    return 'Healthy weight';
  }
  if (bmi < 30) {
    return 'Overweight';
  }
  return 'Obesity';
}

function getCareTips(settings: Settings, cycleLength: number) {
  const bmi = calculateBmi(settings.heightCm, settings.weightKg);
  const tips = [
    {
      icon: 'medkit-outline' as IconName,
      title: 'Prenatal vitamin',
      body: settings.takingPrenatal
        ? 'Great. Keep taking a prenatal with folic acid unless your clinician advised a different plan.'
        : 'Consider a prenatal vitamin with 400 mcg folic acid while trying to conceive.',
    },
    {
      icon: 'scale-outline' as IconName,
      title: 'BMI check',
      body:
        bmi === null
          ? 'Add height and weight in Settings to see a BMI category and a planning prompt.'
          : `${bmi.toFixed(1)} BMI is in the ${getBmiCategory(bmi).toLowerCase()} range. Use this as a screening prompt, not a diagnosis.`,
    },
    {
      icon: 'time-outline' as IconName,
      title: 'When to seek help',
      body:
        settings.age >= 35
          ? settings.tryingMonths >= 6
            ? 'Since age is 35+ and trying time is 6+ months, consider booking an infertility evaluation.'
            : 'At age 35+, many guidelines suggest evaluation after 6 months of trying.'
          : settings.tryingMonths >= 12
            ? 'Since trying time is 12+ months, consider booking an infertility evaluation.'
            : 'If under 35, many guidelines suggest evaluation after 12 months of trying.',
    },
    {
      icon: 'pulse-outline' as IconName,
      title: 'Cycle pattern',
      body:
        cycleLength < 21 || cycleLength > 35
          ? 'Cycles outside 21-35 days can be worth discussing with an ob-gyn, especially while trying.'
          : 'Cycle length is within the common 21-35 day range; keep logging to spot changes.',
    },
  ];

  if (bmi !== null && (bmi < 18.5 || bmi >= 30)) {
    tips.push({
      icon: 'chatbubbles-outline',
      title: 'Weight and ovulation',
      body: 'BMI outside the middle range can affect ovulation for some people. A clinician can help set a safe plan.',
    });
  }

  return tips;
}

function getCycleStart(logs: DayLog[], cycleLength: number) {
  const periodLogs = logs
    .filter((log) => log.flow !== 'None')
    .map((log) => fromISODate(log.date))
    .sort((a, b) => b.getTime() - a.getTime());
  const lastKnownStart = periodLogs[0] ?? initialPeriodStart;
  const elapsed = Math.max(0, daysBetween(lastKnownStart, today));
  return addDays(lastKnownStart, Math.floor(elapsed / cycleLength) * cycleLength);
}

function getPhase(cycleDay: number, settings: Settings): Phase {
  const ovulationDay = Math.max(10, settings.cycleLength - settings.lutealLength);
  const fertileStart = Math.max(1, ovulationDay - 5);
  const fertileEnd = ovulationDay + 1;

  if (cycleDay <= settings.periodLength) {
    return 'Period';
  }
  if (cycleDay === ovulationDay) {
    return 'Ovulation';
  }
  if (cycleDay >= fertileStart && cycleDay <= fertileEnd) {
    return 'Fertile';
  }
  return 'Regular';
}

function createEmptyLog(date = todayISO): DayLog {
  return {
    date,
    flow: 'None',
    mood: 'Calm',
    mucus: 'Creamy',
    temperature: '',
    ovulationTest: 'Not tested',
    pregnancyTest: 'Not tested',
    intercourse: false,
    symptoms: [],
    note: '',
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [authenticated, setAuthenticated] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [lockMessage, setLockMessage] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinSetupInput, setPinSetupInput] = useState('');
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [logs, setLogs] = useState<DayLog[]>(seedLogs);
  const [draftLog, setDraftLog] = useState<DayLog>(() => logs.find((log) => log.date === todayISO) ?? createEmptyLog());

  useEffect(() => {
    const loadSavedState = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as { logs?: DayLog[]; settings?: Settings };
          if (parsed.logs?.length) {
            setLogs(parsed.logs);
            setDraftLog(parsed.logs.find((log) => log.date === todayISO) ?? createEmptyLog());
          }
          if (parsed.settings) {
            const mergedSettings = { ...defaultSettings, ...parsed.settings };
            setSettings(mergedSettings);
          }
        }
      } catch {
        // Keep the seeded demo state if local storage cannot be read.
      } finally {
        setHydrated(true);
      }
    };

    void loadSavedState();
  }, []);

  useEffect(() => {
    const loadLockState = async () => {
      const [compatible, enrolled, savedPin] = await Promise.all([
        LocalAuthentication.hasHardwareAsync().catch(() => false),
        LocalAuthentication.isEnrolledAsync().catch(() => false),
        SecureStore.getItemAsync(PIN_KEY).catch(() => null),
      ]);

      setBiometricAvailable(compatible && enrolled);
      setStoredPin(savedPin);
    };

    void loadLockState();
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ logs, settings }));
  }, [hydrated, logs, settings]);

  useEffect(() => {
    setAuthenticated(!settings.privacyLock || !storedPin);
  }, [settings.privacyLock, storedPin]);

  const cycle = useMemo(() => {
    const cycleStart = getCycleStart(logs, settings.cycleLength);
    const currentCycleDay = daysBetween(cycleStart, today) + 1;
    const ovulation = addDays(cycleStart, Math.max(10, settings.cycleLength - settings.lutealLength) - 1);
    const fertileStart = addDays(ovulation, -5);
    const fertileEnd = addDays(ovulation, 1);
    const nextPeriod = addDays(cycleStart, settings.cycleLength);
    const daysToPeriod = Math.max(0, daysBetween(today, nextPeriod));
    const calendarDays = Array.from({ length: settings.cycleLength }, (_, index) => {
      const date = addDays(cycleStart, index);
      const isoDate = toISODate(date);
      return {
        date,
        isoDate,
        cycleDay: index + 1,
        phase: getPhase(index + 1, settings),
        log: logs.find((entry) => entry.date === isoDate),
      };
    });

    return { calendarDays, currentCycleDay, daysToPeriod, fertileEnd, fertileStart, nextPeriod, ovulation };
  }, [logs, settings]);

  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const loggedDays = logs.length;
  const symptomCount = logs.reduce((total, log) => total + log.symptoms.length, 0);
  const positiveOvulation = logs.filter((log) => log.ovulationTest === 'Positive').length;
  const latestTemp = [...logs].reverse().find((log) => log.temperature.trim())?.temperature;

  const saveDraft = () => {
    setLogs((current) => {
      const withoutDraft = current.filter((log) => log.date !== draftLog.date);
      return [...withoutDraft, draftLog].sort((a, b) => a.date.localeCompare(b.date));
    });
    setActiveTab('home');
  };

  const updateDraft = <Key extends keyof DayLog>(key: Key, value: DayLog[Key]) => {
    setDraftLog((current) => ({ ...current, [key]: value }));
  };

  const toggleSymptom = (symptom: Symptom) => {
    setDraftLog((current) => ({
      ...current,
      symptoms: current.symptoms.includes(symptom)
        ? current.symptoms.filter((item) => item !== symptom)
        : [...current.symptoms, symptom],
    }));
  };

  const logPeriodToday = () => {
    const periodLog: DayLog = { ...draftLog, date: todayISO, flow: draftLog.flow === 'None' ? 'Medium' : draftLog.flow };
    setDraftLog(periodLog);
    setLogs((current) => [...current.filter((log) => log.date !== todayISO), periodLog]);
  };

  const updateSetting = <Key extends keyof Settings>(key: Key, value: Settings[Key]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const clearLocalData = () => {
    setSettings(defaultSettings);
    setLogs([]);
    setDraftLog(createEmptyLog());
    void AsyncStorage.removeItem(STORAGE_KEY);
  };

  const savePin = async (pin: string) => {
    if (pin.length !== 4) {
      setLockMessage('Enter a 4 digit PIN.');
      return;
    }

    await SecureStore.setItemAsync(PIN_KEY, pin);
    setStoredPin(pin);
    setPinSetupInput('');
    setLockMessage('PIN lock is enabled.');
    setSettings((current) => ({ ...current, privacyLock: true }));
    setAuthenticated(true);
  };

  const disablePrivacyLock = async () => {
    await SecureStore.deleteItemAsync(PIN_KEY);
    setStoredPin(null);
    setPinInput('');
    setPinSetupInput('');
    setLockMessage('');
    setSettings((current) => ({ ...current, privacyLock: false }));
    setAuthenticated(true);
  };

  const unlockWithPin = () => {
    if (pinInput === storedPin) {
      setAuthenticated(true);
      setPinInput('');
      setLockMessage('');
      return;
    }

    setLockMessage('Incorrect PIN. Try again.');
  };

  const unlockWithBiometrics = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Fertility Tracker',
      cancelLabel: 'Use PIN',
      disableDeviceFallback: false,
    });

    if (result.success) {
      setAuthenticated(true);
      setLockMessage('');
    } else {
      setLockMessage('Biometric unlock was not completed.');
    }
  };

  if (hydrated && settings.privacyLock && storedPin && !authenticated) {
    return (
      <LockScreen
        biometricAvailable={biometricAvailable}
        message={lockMessage}
        onBiometricUnlock={unlockWithBiometrics}
        onPinChange={setPinInput}
        onPinUnlock={unlockWithPin}
        pin={pinInput}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.shell}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {activeTab === 'home' && (
            <HomeScreen
              cycle={cycle}
              loggedDays={loggedDays}
              positiveOvulation={positiveOvulation}
              settings={settings}
              latestLog={sortedLogs[0]}
              latestTemp={latestTemp}
              symptomCount={symptomCount}
              onLogPeriod={logPeriodToday}
              onOpenLog={() => setActiveTab('log')}
            />
          )}
          {activeTab === 'log' && (
            <LogScreen
              draftLog={draftLog}
              onSave={saveDraft}
              onToggleSymptom={toggleSymptom}
              onUpdate={updateDraft}
            />
          )}
          {activeTab === 'calendar' && <CalendarScreen cycle={cycle} settings={settings} />}
          {activeTab === 'insights' && <InsightsScreen logs={sortedLogs} cycle={cycle} settings={settings} />}
          {activeTab === 'settings' && (
            <SettingsScreen
              biometricAvailable={biometricAvailable}
              lockMessage={lockMessage}
              onClearData={clearLocalData}
              onDisablePrivacyLock={disablePrivacyLock}
              onPinChange={setPinSetupInput}
              onSavePin={() => savePin(pinSetupInput)}
              onUpdate={updateSetting}
              pin={pinSetupInput}
              settings={settings}
              storedPin={storedPin}
            />
          )}
        </ScrollView>

        <View style={styles.tabBar}>
          <TabButton active={activeTab === 'home'} icon="home-outline" label="Home" onPress={() => setActiveTab('home')} />
          <TabButton active={activeTab === 'log'} icon="add-circle-outline" label="Log" onPress={() => setActiveTab('log')} />
          <TabButton active={activeTab === 'calendar'} icon="calendar-outline" label="Calendar" onPress={() => setActiveTab('calendar')} />
          <TabButton active={activeTab === 'insights'} icon="bar-chart-outline" label="Insights" onPress={() => setActiveTab('insights')} />
          <TabButton active={activeTab === 'settings'} icon="settings-outline" label="Settings" onPress={() => setActiveTab('settings')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function HomeScreen({
  cycle,
  loggedDays,
  positiveOvulation,
  settings,
  latestLog,
  latestTemp,
  symptomCount,
  onLogPeriod,
  onOpenLog,
}: {
  cycle: ReturnType<typeof buildCycleSummary>;
  loggedDays: number;
  positiveOvulation: number;
  settings: Settings;
  latestLog?: DayLog;
  latestTemp?: string;
  symptomCount: number;
  onLogPeriod: () => void;
  onOpenLog: () => void;
}) {
  return (
    <View>
      <Header title={`Cycle day ${cycle.currentCycleDay}`} subtitle="Today" icon="person-outline" />
      <View style={styles.summaryPanel}>
        <View style={styles.summaryText}>
          <Text style={styles.summaryLabel}>Next period</Text>
          <Text style={styles.summaryDate}>{formatDate(cycle.nextPeriod)}</Text>
          <Text style={styles.summaryMeta}>{cycle.daysToPeriod} days away</Text>
        </View>
        <View style={styles.ring}>
          <Text style={styles.ringValue}>{settings.cycleLength}</Text>
          <Text style={styles.ringLabel}>day cycle</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <InfoTile icon="flower-outline" label="Fertile window" value={`${formatDate(cycle.fertileStart)}-${formatDate(cycle.fertileEnd)}`} />
        <InfoTile icon="radio-button-on-outline" label="Ovulation" value={formatDate(cycle.ovulation)} />
      </View>

      <View style={styles.actionRow}>
        <Pressable onPress={onLogPeriod} style={styles.primaryButton}>
          <Ionicons name="water-outline" size={19} color="#ffffff" />
          <Text style={styles.primaryButtonText}>Period started</Text>
        </Pressable>
        <Pressable onPress={onOpenLog} style={styles.secondaryButton}>
          <Ionicons name="create-outline" size={19} color="#316960" />
          <Text style={styles.secondaryButtonText}>Log today</Text>
        </Pressable>
      </View>

      <SectionTitle label="Cycle Timeline" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
        {cycle.calendarDays.slice(0, 28).map((day) => (
          <View key={day.isoDate} style={[styles.dayCell, phaseStyle[day.phase], day.isoDate === todayISO && styles.todayCell]}>
            <Text style={styles.dayLabel}>{day.date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1)}</Text>
            <Text style={styles.dayNumber}>{day.date.getDate()}</Text>
            <View style={[styles.phaseDot, phaseDotStyle[day.phase]]} />
          </View>
        ))}
      </ScrollView>

      <SectionTitle label="At a Glance" />
      <View style={styles.statsGrid}>
        <StatCard label="Logged days" value={String(loggedDays)} icon="journal-outline" />
        <StatCard label="Symptoms" value={String(symptomCount)} icon="pulse-outline" />
        <StatCard label="LH positives" value={String(positiveOvulation)} icon="flask-outline" />
        <StatCard label="Last BBT" value={latestTemp ? `${latestTemp} F` : '--'} icon="thermometer-outline" />
      </View>

      <SectionTitle label="Latest Entry" />
      {latestLog ? <HistoryCard log={latestLog} /> : <EmptyState label="No entries yet" />}
    </View>
  );
}

function LogScreen({
  draftLog,
  onSave,
  onToggleSymptom,
  onUpdate,
}: {
  draftLog: DayLog;
  onSave: () => void;
  onToggleSymptom: (symptom: Symptom) => void;
  onUpdate: <Key extends keyof DayLog>(key: Key, value: DayLog[Key]) => void;
}) {
  return (
    <View>
      <Header title="Daily Log" subtitle={formatFullDate(draftLog.date)} icon="create-outline" />

      <SectionTitle label="Flow" />
      <SegmentedControl options={flows} value={draftLog.flow} onChange={(value) => onUpdate('flow', value as Flow)} />

      <SectionTitle label="Fertility Signals" />
      <View style={styles.formPanel}>
        <Text style={styles.inputLabel}>Cervical mucus</Text>
        <SegmentedControl options={mucusOptions} value={draftLog.mucus} onChange={(value) => onUpdate('mucus', value as Mucus)} compact />
        <View style={styles.inputRowSpaced}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>BBT</Text>
            <TextInput
              accessibilityLabel="Basal body temperature"
              inputMode="decimal"
              keyboardType="decimal-pad"
              onChangeText={(value) => onUpdate('temperature', value)}
              placeholder="97.8"
              placeholderTextColor="#8f8781"
              style={styles.input}
              value={draftLog.temperature}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Intercourse</Text>
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: draftLog.intercourse }}
              onPress={() => onUpdate('intercourse', !draftLog.intercourse)}
              style={[styles.toggleButton, draftLog.intercourse && styles.toggleButtonActive]}
            >
              <Ionicons name={draftLog.intercourse ? 'heart' : 'heart-outline'} size={19} color={draftLog.intercourse ? '#ffffff' : '#5f5a56'} />
              <Text style={[styles.toggleButtonText, draftLog.intercourse && styles.toggleButtonTextActive]}>
                {draftLog.intercourse ? 'Logged' : 'No'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <SectionTitle label="Tests" />
      <View style={styles.formPanel}>
        <Text style={styles.inputLabel}>Ovulation test</Text>
        <SegmentedControl options={testResults} value={draftLog.ovulationTest} onChange={(value) => onUpdate('ovulationTest', value as TestResult)} compact />
        <Text style={styles.inputLabelPadded}>Pregnancy test</Text>
        <SegmentedControl options={testResults} value={draftLog.pregnancyTest} onChange={(value) => onUpdate('pregnancyTest', value as TestResult)} compact />
      </View>

      <SectionTitle label="Mood" />
      <SegmentedControl options={moods} value={draftLog.mood} onChange={(value) => onUpdate('mood', value as Mood)} />

      <SectionTitle label="Symptoms" />
      <View style={styles.symptomGrid}>
        {symptoms.map((symptom) => {
          const selected = draftLog.symptoms.includes(symptom);
          return (
            <Pressable
              key={symptom}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              onPress={() => onToggleSymptom(symptom)}
              style={[styles.symptomButton, selected && styles.symptomButtonSelected]}
            >
              <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={selected ? '#ffffff' : '#5f5a56'} />
              <Text style={[styles.symptomText, selected && styles.symptomTextSelected]}>{symptom}</Text>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle label="Daily Note" />
      <TextInput
        accessibilityLabel="Daily note"
        multiline
        onChangeText={(value) => onUpdate('note', value)}
        placeholder="Add medication, appointments, cervical position, or anything else"
        placeholderTextColor="#8f8781"
        style={styles.noteInput}
        textAlignVertical="top"
        value={draftLog.note}
      />

      <Pressable onPress={onSave} style={styles.saveButton}>
        <Ionicons name="save-outline" size={19} color="#ffffff" />
        <Text style={styles.primaryButtonText}>Save entry</Text>
      </Pressable>
    </View>
  );
}

function CalendarScreen({ cycle, settings }: { cycle: ReturnType<typeof buildCycleSummary>; settings: Settings }) {
  return (
    <View>
      <Header title="Cycle Calendar" subtitle={`${settings.cycleLength} day cycle`} icon="calendar-outline" />
      <View style={styles.calendarGrid}>
        {cycle.calendarDays.map((day) => (
          <View key={day.isoDate} style={[styles.calendarDay, phaseStyle[day.phase], day.isoDate === todayISO && styles.todayCell]}>
            <Text style={styles.calendarDayNumber}>{day.date.getDate()}</Text>
            <Text style={styles.calendarCycleDay}>D{day.cycleDay}</Text>
            {day.log && <View style={styles.logBadge} />}
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        {(['Period', 'Fertile', 'Ovulation', 'Regular'] as Phase[]).map((phase) => (
          <View key={phase} style={styles.legendItem}>
            <View style={[styles.phaseDot, phaseDotStyle[phase]]} />
            <Text style={styles.legendText}>{phase}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function InsightsScreen({ logs, cycle, settings }: { logs: DayLog[]; cycle: ReturnType<typeof buildCycleSummary>; settings: Settings }) {
  const flowDays = logs.filter((log) => log.flow !== 'None').length;
  const intercourseDays = logs.filter((log) => log.intercourse).length;
  const bmi = calculateBmi(settings.heightCm, settings.weightKg);
  const careTips = getCareTips(settings, settings.cycleLength);
  const commonSymptoms = symptoms
    .map((symptom) => ({ symptom, count: logs.filter((log) => log.symptoms.includes(symptom)).length }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <View>
      <Header title="Insights" subtitle="Patterns and predictions" icon="bar-chart-outline" />
      <View style={styles.statsGrid}>
        <StatCard label="Cycle length" value={`${settings.cycleLength}d`} icon="refresh-outline" />
        <StatCard label="Flow days" value={String(flowDays)} icon="water-outline" />
        <StatCard label="Fertile starts" value={formatDate(cycle.fertileStart)} icon="flower-outline" />
        <StatCard label="BMI" value={bmi ? bmi.toFixed(1) : '--'} icon="scale-outline" />
      </View>

      <SectionTitle label="TTC Care Plan" />
      <View style={styles.formPanel}>
        {careTips.map((tip) => (
          <CareTip key={tip.title} icon={tip.icon} title={tip.title} body={tip.body} />
        ))}
      </View>

      <SectionTitle label="Symptoms Trend" />
      <View style={styles.formPanel}>
        {commonSymptoms.length ? (
          commonSymptoms.map((item) => (
            <View key={item.symptom} style={styles.trendRow}>
              <Text style={styles.trendLabel}>{item.symptom}</Text>
              <View style={styles.trendTrack}>
                <View style={[styles.trendFill, { width: `${Math.min(100, item.count * 24)}%` }]} />
              </View>
              <Text style={styles.trendCount}>{item.count}</Text>
            </View>
          ))
        ) : (
          <EmptyState label="Log symptoms to see trends" />
        )}
      </View>

      <SectionTitle label="History" />
      <View style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyDate}>Intercourse timing</Text>
          <Text style={styles.historyFlow}>{intercourseDays} days</Text>
        </View>
        <Text style={styles.historyMeta}>
          Try logging sex, cervical mucus, LH tests, and BBT together for a clearer ovulation pattern.
        </Text>
      </View>
      {logs.map((log) => (
        <HistoryCard key={log.date} log={log} />
      ))}
    </View>
  );
}

function SettingsScreen({
  biometricAvailable,
  lockMessage,
  onClearData,
  onDisablePrivacyLock,
  onPinChange,
  onSavePin,
  onUpdate,
  pin,
  settings,
  storedPin,
}: {
  biometricAvailable: boolean;
  lockMessage: string;
  settings: Settings;
  onClearData: () => void;
  onDisablePrivacyLock: () => void;
  onPinChange: (pin: string) => void;
  onSavePin: () => void;
  onUpdate: <Key extends keyof Settings>(key: Key, value: Settings[Key]) => void;
  pin: string;
  storedPin: string | null;
}) {
  return (
    <View>
      <Header title="Settings" subtitle="Cycle, reminders, privacy" icon="settings-outline" />
      <View style={styles.formPanel}>
        <Stepper label="Age" value={settings.age} min={18} max={50} suffix="years" onChange={(value) => onUpdate('age', value)} />
        <Stepper label="Trying for" value={settings.tryingMonths} min={0} max={60} suffix="months" onChange={(value) => onUpdate('tryingMonths', value)} />
        <Stepper label="Average cycle" value={settings.cycleLength} min={21} max={45} suffix="days" onChange={(value) => onUpdate('cycleLength', value)} />
        <Stepper label="Period length" value={settings.periodLength} min={2} max={9} suffix="days" onChange={(value) => onUpdate('periodLength', value)} />
        <Stepper label="Luteal phase" value={settings.lutealLength} min={10} max={16} suffix="days" onChange={(value) => onUpdate('lutealLength', value)} />
      </View>

      <SectionTitle label="BMI and Prep" />
      <View style={styles.formPanel}>
        <View style={styles.inputRowSpaced}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Height</Text>
            <TextInput
              accessibilityLabel="Height in centimeters"
              inputMode="decimal"
              keyboardType="decimal-pad"
              onChangeText={(value) => onUpdate('heightCm', value)}
              placeholder="165"
              placeholderTextColor="#8f8781"
              style={styles.input}
              value={settings.heightCm}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Weight</Text>
            <TextInput
              accessibilityLabel="Weight in kilograms"
              inputMode="decimal"
              keyboardType="decimal-pad"
              onChangeText={(value) => onUpdate('weightKg', value)}
              placeholder="62"
              placeholderTextColor="#8f8781"
              style={styles.input}
              value={settings.weightKg}
            />
          </View>
        </View>
        <Text style={styles.bmiSummary}>
          BMI: {calculateBmi(settings.heightCm, settings.weightKg)?.toFixed(1) ?? '--'} · {getBmiCategory(calculateBmi(settings.heightCm, settings.weightKg))}
        </Text>
        <SwitchRow label="Taking prenatal or folic acid" value={settings.takingPrenatal} onValueChange={(value) => onUpdate('takingPrenatal', value)} />
      </View>

      <SectionTitle label="Reminders" />
      <View style={styles.formPanel}>
        <SwitchRow label="Fertile window reminder" value={settings.fertileReminder} onValueChange={(value) => onUpdate('fertileReminder', value)} />
        <SwitchRow label="Period reminder" value={settings.periodReminder} onValueChange={(value) => onUpdate('periodReminder', value)} />
      </View>

      <SectionTitle label="Privacy Lock" />
      <View style={styles.formPanel}>
        <View style={styles.lockStatusRow}>
          <View>
            <Text style={styles.lockStatusTitle}>{settings.privacyLock && storedPin ? 'PIN lock active' : 'PIN lock off'}</Text>
            <Text style={styles.lockStatusText}>
              {biometricAvailable ? 'Face ID / biometrics available after PIN setup.' : 'Biometric unlock is not available on this device.'}
            </Text>
          </View>
          <Ionicons name={settings.privacyLock && storedPin ? 'lock-closed-outline' : 'lock-open-outline'} size={22} color="#316960" />
        </View>
        <TextInput
          accessibilityLabel="Set four digit PIN"
          inputMode="numeric"
          keyboardType="number-pad"
          maxLength={4}
          onChangeText={(value) => onPinChange(value.replace(/\D/g, '').slice(0, 4))}
          placeholder={storedPin ? 'New 4 digit PIN' : 'Create 4 digit PIN'}
          placeholderTextColor="#8f8781"
          secureTextEntry
          style={styles.input}
          value={pin}
        />
        {!!lockMessage && <Text style={styles.lockMessage}>{lockMessage}</Text>}
        <View style={styles.actionRow}>
          <Pressable onPress={onSavePin} style={styles.primaryButton}>
            <Ionicons name="keypad-outline" size={19} color="#ffffff" />
            <Text style={styles.primaryButtonText}>{storedPin ? 'Reset PIN' : 'Enable PIN'}</Text>
          </Pressable>
          <Pressable onPress={onDisablePrivacyLock} style={styles.secondaryButton}>
            <Ionicons name="lock-open-outline" size={19} color="#316960" />
            <Text style={styles.secondaryButtonText}>Disable</Text>
          </Pressable>
        </View>
      </View>

      <SectionTitle label="Data Control" />
      <Pressable onPress={onClearData} style={styles.dangerButton}>
        <Ionicons name="trash-outline" size={19} color="#c5534b" />
        <Text style={styles.dangerButtonText}>Clear local data</Text>
      </Pressable>

      <View style={styles.disclaimer}>
        <Ionicons name="shield-checkmark-outline" size={18} color="#71665f" />
        <Text style={styles.disclaimerText}>
          Predictions are estimates from your logged dates. They are not medical advice and should not be used as the only method for preventing pregnancy.
        </Text>
      </View>
    </View>
  );
}

function buildCycleSummary() {
  return {
    calendarDays: [] as Array<{ date: Date; isoDate: string; cycleDay: number; phase: Phase; log?: DayLog }>,
    currentCycleDay: 1,
    daysToPeriod: 0,
    fertileEnd: today,
    fertileStart: today,
    nextPeriod: today,
    ovulation: today,
  };
}

function LockScreen({
  biometricAvailable,
  message,
  onBiometricUnlock,
  onPinChange,
  onPinUnlock,
  pin,
}: {
  biometricAvailable: boolean;
  message: string;
  onBiometricUnlock: () => void;
  onPinChange: (pin: string) => void;
  onPinUnlock: () => void;
  pin: string;
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.lockScreen}>
        <View style={styles.lockIconLarge}>
          <Ionicons name="lock-closed-outline" size={38} color="#316960" />
        </View>
        <Text style={styles.lockTitle}>Fertility Tracker</Text>
        <Text style={styles.lockSubtitle}>Unlock to view your private cycle data.</Text>
        <TextInput
          accessibilityLabel="Enter four digit PIN"
          inputMode="numeric"
          keyboardType="number-pad"
          maxLength={4}
          onChangeText={(value) => onPinChange(value.replace(/\D/g, '').slice(0, 4))}
          placeholder="4 digit PIN"
          placeholderTextColor="#8f8781"
          secureTextEntry
          style={styles.lockInput}
          value={pin}
        />
        {!!message && <Text style={styles.lockMessage}>{message}</Text>}
        <Pressable onPress={onPinUnlock} style={styles.lockPrimaryButton}>
          <Ionicons name="keypad-outline" size={19} color="#ffffff" />
          <Text style={styles.primaryButtonText}>Unlock</Text>
        </Pressable>
        {biometricAvailable && (
          <Pressable onPress={onBiometricUnlock} style={styles.lockSecondaryButton}>
            <Ionicons name="finger-print-outline" size={20} color="#316960" />
            <Text style={styles.secondaryButtonText}>Use Face ID / biometrics</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

function Header({ title, subtitle, icon }: { title: string; subtitle: string; icon: IconName }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.eyebrow}>{subtitle}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.iconButton}>
        <Ionicons name={icon} size={20} color="#32302f" />
      </View>
    </View>
  );
}

function SectionTitle({ label }: { label: string }) {
  return <Text style={styles.sectionTitle}>{label}</Text>;
}

function InfoTile({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.infoTile}>
      <Ionicons name={icon} size={21} color="#316960" />
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
    </View>
  );
}

function StatCard({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={20} color="#316960" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SegmentedControl({ compact, onChange, options, value }: { compact?: boolean; onChange: (value: string) => void; options: string[]; value: string }) {
  return (
    <View style={[styles.segmentWrap, compact && styles.segmentWrapCompact]}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable key={option} onPress={() => onChange(option)} style={[styles.segment, selected && styles.segmentSelected]}>
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Stepper({ label, max, min, onChange, suffix, value }: { label: string; max: number; min: number; onChange: (value: number) => void; suffix: string; value: number }) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable accessibilityLabel={`Decrease ${label}`} onPress={() => onChange(Math.max(min, value - 1))} style={styles.stepperButton}>
          <Ionicons name="remove" size={18} color="#32302f" />
        </Pressable>
        <Text style={styles.stepperValue}>{value} {suffix}</Text>
        <Pressable accessibilityLabel={`Increase ${label}`} onPress={() => onChange(Math.min(max, value + 1))} style={styles.stepperButton}>
          <Ionicons name="add" size={18} color="#32302f" />
        </Pressable>
      </View>
    </View>
  );
}

function SwitchRow({ label, onValueChange, value }: { label: string; onValueChange: (value: boolean) => void; value: boolean }) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch onValueChange={onValueChange} value={value} trackColor={{ false: '#d8cdc5', true: '#8dc5bb' }} thumbColor={value ? '#316960' : '#ffffff'} />
    </View>
  );
}

function CareTip({ body, icon, title }: { body: string; icon: IconName; title: string }) {
  return (
    <View style={styles.careTip}>
      <View style={styles.careIcon}>
        <Ionicons name={icon} size={18} color="#316960" />
      </View>
      <View style={styles.careText}>
        <Text style={styles.careTitle}>{title}</Text>
        <Text style={styles.careBody}>{body}</Text>
      </View>
    </View>
  );
}

function HistoryCard({ log }: { log: DayLog }) {
  return (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyDate}>{formatFullDate(log.date)}</Text>
        <Text style={styles.historyFlow}>{log.flow}</Text>
      </View>
      <Text style={styles.historyMeta}>
        {log.mood} mood · {log.mucus} mucus · LH {log.ovulationTest}
      </Text>
      {!!log.symptoms.length && <Text style={styles.historySymptoms}>{log.symptoms.join(', ')}</Text>}
      {!!log.note && <Text style={styles.historyNote}>{log.note}</Text>}
    </View>
  );
}

function EmptyState({ label }: { label: string }) {
  return <Text style={styles.emptyState}>{label}</Text>;
}

function TabButton({ active, icon, label, onPress }: { active: boolean; icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.tabButton}>
      <Ionicons name={icon} size={22} color={active ? '#c5534b' : '#7a716b'} />
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const phaseStyle = StyleSheet.create({
  Period: { backgroundColor: '#fce8e5' },
  Fertile: { backgroundColor: '#e0f0ed' },
  Ovulation: { backgroundColor: '#fff0c8' },
  Regular: { backgroundColor: '#f5f0eb' },
});

const phaseDotStyle = StyleSheet.create({
  Period: { backgroundColor: '#d76259' },
  Fertile: { backgroundColor: '#2f8276' },
  Ovulation: { backgroundColor: '#d19519' },
  Regular: { backgroundColor: '#b8aaa0' },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff8f3' },
  shell: { flex: 1 },
  container: { padding: 20, paddingBottom: 104 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  eyebrow: { color: '#726963', fontSize: 13, fontWeight: '700', letterSpacing: 0, textTransform: 'uppercase' },
  title: { color: '#292725', fontSize: 31, fontWeight: '800', letterSpacing: 0, marginTop: 2 },
  iconButton: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#eaded6', borderRadius: 8, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 },
  summaryPanel: { backgroundColor: '#37312e', borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, padding: 18 },
  summaryText: { flex: 1, justifyContent: 'center', paddingRight: 12 },
  summaryLabel: { color: '#f6c9bd', fontSize: 14, fontWeight: '700', letterSpacing: 0 },
  summaryDate: { color: '#ffffff', fontSize: 30, fontWeight: '800', letterSpacing: 0, marginTop: 4 },
  summaryMeta: { color: '#f0e7df', fontSize: 15, marginTop: 4 },
  ring: { alignItems: 'center', alignSelf: 'center', borderColor: '#f0b1a5', borderRadius: 60, borderWidth: 5, height: 104, justifyContent: 'center', width: 104 },
  ringValue: { color: '#ffffff', fontSize: 29, fontWeight: '800', letterSpacing: 0 },
  ringLabel: { color: '#f2ded6', fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row', gap: 12 },
  infoTile: { backgroundColor: '#ffffff', borderColor: '#eaded6', borderRadius: 8, borderWidth: 1, flex: 1, minHeight: 112, padding: 14 },
  tileLabel: { color: '#71665f', fontSize: 13, fontWeight: '700', marginTop: 10 },
  tileValue: { color: '#292725', fontSize: 17, fontWeight: '800', letterSpacing: 0, marginTop: 5 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  primaryButton: { alignItems: 'center', backgroundColor: '#c5534b', borderRadius: 8, flex: 1, flexDirection: 'row', gap: 8, height: 48, justifyContent: 'center' },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '800', letterSpacing: 0 },
  secondaryButton: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#b8d8d2', borderRadius: 8, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 8, height: 48, justifyContent: 'center' },
  secondaryButtonText: { color: '#316960', fontSize: 16, fontWeight: '800', letterSpacing: 0 },
  dangerButton: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#f0b1a5', borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 8, height: 50, justifyContent: 'center' },
  dangerButtonText: { color: '#c5534b', fontSize: 16, fontWeight: '800', letterSpacing: 0 },
  lockScreen: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  lockIconLarge: { alignItems: 'center', backgroundColor: '#e0f0ed', borderRadius: 8, height: 76, justifyContent: 'center', marginBottom: 18, width: 76 },
  lockTitle: { color: '#292725', fontSize: 31, fontWeight: '800', letterSpacing: 0 },
  lockSubtitle: { color: '#635a54', fontSize: 15, lineHeight: 21, marginBottom: 22, marginTop: 8, maxWidth: 280, textAlign: 'center' },
  lockInput: { backgroundColor: '#ffffff', borderColor: '#eaded6', borderRadius: 8, borderWidth: 1, color: '#292725', fontSize: 22, fontWeight: '800', height: 54, letterSpacing: 0, marginBottom: 10, paddingHorizontal: 16, textAlign: 'center', width: 220 },
  lockMessage: { color: '#c5534b', fontSize: 13, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  lockPrimaryButton: { alignItems: 'center', backgroundColor: '#c5534b', borderRadius: 8, flexDirection: 'row', gap: 8, height: 50, justifyContent: 'center', marginTop: 4, width: 260 },
  lockSecondaryButton: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#b8d8d2', borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 8, height: 50, justifyContent: 'center', marginTop: 10, width: 260 },
  sectionTitle: { color: '#292725', fontSize: 18, fontWeight: '800', letterSpacing: 0, marginBottom: 10, marginTop: 22 },
  dayRow: { gap: 8, paddingRight: 20 },
  dayCell: { alignItems: 'center', borderRadius: 8, height: 82, justifyContent: 'space-between', paddingVertical: 9, width: 46 },
  todayCell: { borderColor: '#292725', borderWidth: 2 },
  dayLabel: { color: '#71665f', fontSize: 12, fontWeight: '700' },
  dayNumber: { color: '#292725', fontSize: 18, fontWeight: '800', letterSpacing: 0 },
  phaseDot: { borderRadius: 4, height: 8, width: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { backgroundColor: '#ffffff', borderColor: '#eaded6', borderRadius: 8, borderWidth: 1, flexGrow: 1, minHeight: 96, minWidth: '47%', padding: 13 },
  statValue: { color: '#292725', fontSize: 23, fontWeight: '800', letterSpacing: 0, marginTop: 8 },
  statLabel: { color: '#71665f', fontSize: 13, fontWeight: '700', marginTop: 3 },
  formPanel: { backgroundColor: '#ffffff', borderColor: '#eaded6', borderRadius: 8, borderWidth: 1, padding: 14 },
  inputRowSpaced: { flexDirection: 'row', gap: 12, marginTop: 14 },
  inputGroup: { flex: 1 },
  inputLabel: { color: '#71665f', fontSize: 13, fontWeight: '700', marginBottom: 7 },
  inputLabelPadded: { color: '#71665f', fontSize: 13, fontWeight: '700', marginBottom: 7, marginTop: 14 },
  input: { backgroundColor: '#f8f3ef', borderColor: '#e3d7cf', borderRadius: 8, borderWidth: 1, color: '#292725', fontSize: 18, fontWeight: '800', height: 48, paddingHorizontal: 12 },
  bmiSummary: { color: '#316960', fontSize: 14, fontWeight: '800', marginBottom: 8, marginTop: 12 },
  toggleButton: { alignItems: 'center', backgroundColor: '#f8f3ef', borderColor: '#e3d7cf', borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 7, height: 48, justifyContent: 'center' },
  toggleButtonActive: { backgroundColor: '#316960', borderColor: '#316960' },
  toggleButtonText: { color: '#5f5a56', fontSize: 15, fontWeight: '800' },
  toggleButtonTextActive: { color: '#ffffff' },
  segmentWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  segmentWrapCompact: { marginBottom: 0 },
  segment: { backgroundColor: '#ffffff', borderColor: '#eaded6', borderRadius: 8, borderWidth: 1, minHeight: 40, paddingHorizontal: 11, paddingVertical: 10 },
  segmentSelected: { backgroundColor: '#316960', borderColor: '#316960' },
  segmentText: { color: '#4f4843', fontSize: 14, fontWeight: '700' },
  segmentTextSelected: { color: '#ffffff' },
  symptomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  symptomButton: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#eaded6', borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 7, minHeight: 42, paddingHorizontal: 11 },
  symptomButtonSelected: { backgroundColor: '#316960', borderColor: '#316960' },
  symptomText: { color: '#4f4843', fontSize: 14, fontWeight: '700' },
  symptomTextSelected: { color: '#ffffff' },
  noteInput: { backgroundColor: '#ffffff', borderColor: '#eaded6', borderRadius: 8, borderWidth: 1, color: '#292725', fontSize: 16, minHeight: 112, padding: 13 },
  saveButton: { alignItems: 'center', backgroundColor: '#c5534b', borderRadius: 8, flexDirection: 'row', gap: 8, height: 50, justifyContent: 'center', marginTop: 18 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  calendarDay: { borderRadius: 8, height: 58, padding: 8, width: '13.1%' },
  calendarDayNumber: { color: '#292725', fontSize: 16, fontWeight: '800', letterSpacing: 0 },
  calendarCycleDay: { color: '#71665f', fontSize: 11, fontWeight: '700', marginTop: 2 },
  logBadge: { backgroundColor: '#c5534b', borderRadius: 4, bottom: 7, height: 8, position: 'absolute', right: 7, width: 8 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  legendText: { color: '#5f5a56', fontSize: 13, fontWeight: '700' },
  trendRow: { alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: 12 },
  trendLabel: { color: '#4f4843', flex: 1, fontSize: 14, fontWeight: '700' },
  trendTrack: { backgroundColor: '#f0e7df', borderRadius: 8, flex: 1.2, height: 10, overflow: 'hidden' },
  trendFill: { backgroundColor: '#316960', borderRadius: 8, height: 10 },
  trendCount: { color: '#292725', fontSize: 14, fontWeight: '800', width: 20 },
  historyCard: { backgroundColor: '#ffffff', borderColor: '#eaded6', borderRadius: 8, borderWidth: 1, marginBottom: 10, padding: 14 },
  historyHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  historyDate: { color: '#292725', fontSize: 16, fontWeight: '800', letterSpacing: 0 },
  historyFlow: { color: '#c5534b', fontSize: 13, fontWeight: '800' },
  historyMeta: { color: '#71665f', fontSize: 13, fontWeight: '700', marginTop: 7 },
  historySymptoms: { color: '#316960', fontSize: 13, fontWeight: '800', marginTop: 7 },
  historyNote: { color: '#4f4843', fontSize: 14, lineHeight: 20, marginTop: 7 },
  stepperRow: { marginBottom: 14 },
  stepper: { alignItems: 'center', backgroundColor: '#f8f3ef', borderColor: '#e3d7cf', borderRadius: 8, borderWidth: 1, flexDirection: 'row', height: 48, justifyContent: 'space-between', paddingHorizontal: 8 },
  stepperButton: { alignItems: 'center', height: 34, justifyContent: 'center', width: 34 },
  stepperValue: { color: '#292725', fontSize: 17, fontWeight: '800', letterSpacing: 0 },
  switchRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 48 },
  switchLabel: { color: '#292725', fontSize: 15, fontWeight: '800' },
  lockStatusRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  lockStatusTitle: { color: '#292725', fontSize: 16, fontWeight: '800', letterSpacing: 0 },
  lockStatusText: { color: '#71665f', fontSize: 13, fontWeight: '700', lineHeight: 18, marginTop: 3, maxWidth: 420 },
  careTip: { alignItems: 'flex-start', borderBottomColor: '#f0e7df', borderBottomWidth: 1, flexDirection: 'row', gap: 10, paddingBottom: 12, paddingTop: 2 },
  careIcon: { alignItems: 'center', backgroundColor: '#e0f0ed', borderRadius: 8, height: 34, justifyContent: 'center', width: 34 },
  careText: { flex: 1 },
  careTitle: { color: '#292725', fontSize: 15, fontWeight: '800', letterSpacing: 0 },
  careBody: { color: '#635a54', fontSize: 13, lineHeight: 18, marginTop: 3 },
  disclaimer: { alignItems: 'flex-start', backgroundColor: '#f2ebe5', borderRadius: 8, flexDirection: 'row', gap: 8, marginTop: 18, padding: 12 },
  disclaimerText: { color: '#635a54', flex: 1, fontSize: 13, lineHeight: 18 },
  emptyState: { color: '#71665f', fontSize: 14, fontWeight: '700', paddingVertical: 10 },
  tabBar: { backgroundColor: '#ffffff', borderColor: '#eaded6', borderTopWidth: 1, bottom: 0, flexDirection: 'row', height: 76, left: 0, paddingTop: 8, position: 'absolute', right: 0 },
  tabButton: { alignItems: 'center', flex: 1, gap: 3 },
  tabText: { color: '#7a716b', fontSize: 11, fontWeight: '800' },
  tabTextActive: { color: '#c5534b' },
});
