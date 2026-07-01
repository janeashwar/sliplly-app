import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { spacing, radius, typography } from '../../src/theme/colors';
import { useTheme } from '../../src/context/ThemeContext';
import { useScroll } from '../../src/context/ScrollContext';
import { toast } from '../../src/utils/toast';
import { hapticWarning, hapticSuccess, hapticError, hapticSelection, hapticMedium } from '../../src/utils/haptics';
import { api } from '../../src/api/client';

// ── Types ──────────────────────────────────────────────

type JourneyType = 'ONE_WAY' | 'ROUND_TRIP';
type PackageType = 'HOURLY' | 'DAY_BASIS' | 'FIXED';

interface Package {
  id: string;
  name: string;
  type?: string;
  vehicleType?: string;
  basePrice?: number;
  baseRate?: number;
  includedKm?: number;
  includedHours?: number;
  extraKmCharge?: number;
  extraKmRate?: number;
  extraHourCharge?: number;
  extraHourRate?: number;
  daysIncluded?: number;
  extraDayPrice?: number;
  [key: string]: any;
}

interface Guest {
  id: string;
  name: string;
  phone?: string;
  mobile?: string;
  [key: string]: any;
}

const STEP_LABELS = ['Route', 'Package', 'Guest & Confirm'] as const;

// ── Helpers ────────────────────────────────────────────

function fmt(d: Date, mode: 'date' | 'time') {
  if (mode === 'date') return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function toIsoDate(display: string): string {
  const p = display.split('/');
  if (p.length === 3) { const [dd,mm,yyyy] = p.map(Number); if (dd&&mm&&yyyy) return `${yyyy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`; }
  return display;
}

// ── Main Component ─────────────────────────────────────

export default function BookingScreen() {
  const insets = useSafeAreaInsets();
  const { setScrollPosition } = useScroll();
  const { colors, shadows, isDark } = useTheme();
  const styles = createStyles(colors, shadows, isDark);

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Step 1: Route
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [journeyType, setJourneyType] = useState<JourneyType>('ONE_WAY');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');

  // Step 2: Package
  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [packageType, setPackageType] = useState<PackageType>('HOURLY');
  const [cabType, setCabType] = useState('');
  const [includedHours, setIncludedHours] = useState('');
  const [includedKm, setIncludedKm] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [extraKmCharge, setExtraKmCharge] = useState('');
  const [extraHourCharge, setExtraHourCharge] = useState('');
  const [daysIncluded, setDaysIncluded] = useState('');
  const [extraDayPrice, setExtraDayPrice] = useState('');
  const [totalFixedPrice, setTotalFixedPrice] = useState('');

  // Step 3: Guest
  const [guestPhone, setGuestPhone] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestSuggestions, setGuestSuggestions] = useState<Guest[]>([]);
  const [showGuestSuggestions, setShowGuestSuggestions] = useState(false);
  const [passengerCount, setPassengerCount] = useState('');
  const [remarks, setRemarks] = useState('');

  // Date/time picker state
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [pickerTarget, setPickerTarget] = useState<'pickupDate' | 'pickupTime' | 'returnDate' | 'returnTime'>('pickupDate');
  const guestSearchRef = useRef<ReturnType<typeof setTimeout>>(undefined!);

  // ── Load Packages ──
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<any>('/partner/packages');
        const list = Array.isArray(res) ? res
          : res?.data?.content ?? res?.data ?? res?.content ?? [];
        setPackages(list);
      } catch (err: any) {
        console.error('Failed to load packages:', err);
        toast.error('Could not load packages');
      } finally {
        setLoadingPackages(false);
      }
    })();
  }, []);

  // ── Guest Search (debounced) ──
  useEffect(() => {
    if (guestSearchRef.current) clearTimeout(guestSearchRef.current);
    if (guestPhone.length < 3) {
      setGuestSuggestions([]);
      setShowGuestSuggestions(false);
      return;
    }
    guestSearchRef.current = setTimeout(async () => {
      try {
        const res = await api.get<any>(`/partner/guests/search?mobile=${encodeURIComponent(guestPhone)}`);
        const list: Guest[] = Array.isArray(res) ? res : res?.data ?? res?.content ?? [];
        setGuestSuggestions(list);
        setShowGuestSuggestions(list.length > 0);
      } catch {
        setGuestSuggestions([]);
        setShowGuestSuggestions(false);
      }
    }, 400);
    return () => { if (guestSearchRef.current) clearTimeout(guestSearchRef.current); };
  }, [guestPhone]);

  // ── Date/Time Picker ──
  const openPicker = (target: typeof pickerTarget, mode: 'date' | 'time') => {
    setPickerTarget(target);
    setPickerMode(mode);
    setPickerVisible(true);
  };

  const onPickerChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setPickerVisible(false);
    if (!selected) return;
    const formatted = fmt(selected, pickerMode);
    switch (pickerTarget) {
      case 'pickupDate': setPickupDate(formatted); break;
      case 'pickupTime': setPickupTime(formatted); break;
      case 'returnDate': setReturnDate(formatted); break;
      case 'returnTime': setReturnTime(formatted); break;
    }
  };

  // ── Package Selection ──
  const handlePackageSelect = (pkg: Package) => {
    hapticMedium();
    setSelectedPackage(pkg);
    setIsCustom(false);
    const t = (pkg.packageType || pkg.type || 'HOURLY').toUpperCase() as PackageType;
    setPackageType(['HOURLY', 'DAY_BASIS', 'FIXED'].includes(t) ? t : 'HOURLY');
    setCabType(pkg.cabType || pkg.vehicleType || '');
    setBasePrice(String(pkg.basePrice ?? pkg.baseRate ?? ''));
    setIncludedKm(String(pkg.includedKm ?? ''));
    setIncludedHours(String(pkg.includedHours ?? ''));
    setExtraKmCharge(String(pkg.extraKmCharge ?? pkg.extraKmRate ?? ''));
    setExtraHourCharge(String(pkg.extraHourCharge ?? pkg.extraHourRate ?? ''));
    setDaysIncluded(String(pkg.daysIncluded ?? ''));
    setExtraDayPrice(String(pkg.extraDayPrice ?? ''));
    setTotalFixedPrice(String(pkg.basePrice ?? pkg.baseRate ?? ''));
  };

  const handleCustomSelect = () => {
    hapticSelection();
    setIsCustom(true);
    setSelectedPackage(null);
    setCabType('');
    setBasePrice('');
    setIncludedKm('');
    setIncludedHours('');
    setExtraKmCharge('');
    setExtraHourCharge('');
    setDaysIncluded('');
    setExtraDayPrice('');
    setTotalFixedPrice('');
  };

  const selectGuest = (g: Guest) => {
    hapticSelection();
    setGuestPhone(g.phone || g.mobile || guestPhone);
    setGuestName(g.name);
    setShowGuestSuggestions(false);
  };

  // ── Validation ──
  const validateStep1 = (): boolean => {
    if (!pickup.trim()) { toast.warning('Enter pickup location'); hapticWarning(); return false; }
    if (!dropoff.trim()) { toast.warning('Enter drop location'); hapticWarning(); return false; }
    if (!pickupDate.trim()) { toast.warning('Select pickup date'); hapticWarning(); return false; }
    if (!pickupTime.trim()) { toast.warning('Select pickup time'); hapticWarning(); return false; }
    if (journeyType === 'ROUND_TRIP') {
      if (!returnDate.trim()) { toast.warning('Select return date'); hapticWarning(); return false; }
      if (!returnTime.trim()) { toast.warning('Select return time'); hapticWarning(); return false; }
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!isCustom && !selectedPackage) { toast.warning('Select a package or choose Custom'); hapticWarning(); return false; }
    if (!basePrice.trim()) { toast.warning('Enter base price'); hapticWarning(); return false; }
    return true;
  };

  const validateStep3 = (): boolean => {
    if (!guestPhone.trim() || guestPhone.length < 10) { toast.warning('Enter valid 10-digit phone'); hapticWarning(); return false; }
    if (!guestName.trim()) { toast.warning('Enter guest name'); hapticWarning(); return false; }
    return true;
  };

  // ── Submit ──
  const handleCreateBooking = async () => {
    if (!validateStep3()) return;
    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {
        guestName,
        guestContact: guestPhone,
        pickupLocation: pickup,
        dropLocation: dropoff || undefined,
        journeyType,
        pickupDatetime: `${toIsoDate(pickupDate)}T${pickupTime}`,
        passengerCount: passengerCount || undefined,
        remarks: remarks || undefined,
        isGstEnabled: false,
        isCorporateTrip: false,
        isCustomPackage: isCustom || false,
      };

      // Package fields — server expects custom* prefix
      if (isCustom || selectedPackage) {
        payload.customCabType = cabType || undefined;
        payload.customPackageType = packageType || undefined;
        payload.customIncludedHours = includedHours ? Number(includedHours) : null;
        payload.customIncludedKm = includedKm ? Number(includedKm) : null;
        payload.customBasePrice = basePrice ? Number(basePrice) : null;
        payload.customExtraKmCharge = extraKmCharge ? Number(extraKmCharge) : null;
        payload.customExtraHourCharge = extraHourCharge ? Number(extraHourCharge) : null;
        payload.customIncludedDays = daysIncluded ? Number(daysIncluded) : null;
        payload.customExtraDayPrice = extraDayPrice ? Number(extraDayPrice) : null;
      }

      // If using a pre-made package (not custom)
      if (!isCustom && selectedPackage) {
        payload.packageId = String(selectedPackage.id);
      }

      if (journeyType === 'ROUND_TRIP' && returnDate) {
        payload.returnDatetime = `${toIsoDate(returnDate)}T${returnTime}`;
      }
      await api.post('/partner/trips', payload);
      hapticSuccess();
      setShowSuccess(true);
      toast.success(`Booking created for ${guestName}!`, 'Success');
      setTimeout(() => {
        setShowSuccess(false);
        resetForm();
      }, 2000);
    } catch (err: any) {
      console.error('Booking creation failed:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      // Try to extract server validation errors
      const serverMsg = err?.message || 'Failed to create booking';
      const detail = err?.response?.data?.message || err?.data?.message || err?.errors?.join?.(', ');
      toast.error(detail || serverMsg, 'Booking Error');
      hapticError();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(0);
    setPickup(''); setDropoff('');
    setJourneyType('ONE_WAY');
    setPickupDate(''); setPickupTime(''); setReturnDate(''); setReturnTime('');
    setSelectedPackage(null); setIsCustom(false);
    setCabType(''); setBasePrice(''); setIncludedKm(''); setIncludedHours('');
    setExtraKmCharge(''); setExtraHourCharge(''); setDaysIncluded('');
    setExtraDayPrice(''); setTotalFixedPrice('');
    setGuestPhone(''); setGuestName(''); setPassengerCount(''); setRemarks('');
  };

  // ── Render Helpers ──
  const renderInput = (
    label: string, value: string, onChange: (t: string) => void,
    placeholder: string, icon: string,
    opts?: { keyboardType?: 'default' | 'number-pad' | 'phone-pad'; multiline?: boolean }
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, opts?.multiline && styles.textAreaWrap]}>
        <Ionicons name={icon as any} size={18} color={colors.text.tertiary} />
        <TextInput
          style={[styles.input, opts?.multiline && { height: 72 }]}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          value={value}
          onChangeText={onChange}
          keyboardType={opts?.keyboardType || 'default'}
          multiline={opts?.multiline}
          textAlignVertical={opts?.multiline ? 'top' : 'center'}
        />
      </View>
    </View>
  );

  const renderDateField = (label: string, value: string, target: typeof pickerTarget) => (
    <View style={[styles.field, { flex: 1 }]}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.inputWrap} onPress={() => openPicker(target, 'date')}>
        <Ionicons name="calendar-outline" size={18} color={colors.text.tertiary} />
        <Text style={[styles.inputText, !value && { color: colors.text.tertiary }]}>
          {value || 'DD/MM/YYYY'}
        </Text>
      </Pressable>
    </View>
  );

  const renderTimeField = (label: string, value: string, target: typeof pickerTarget) => (
    <View style={[styles.field, { flex: 1 }]}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.inputWrap} onPress={() => openPicker(target, 'time')}>
        <Ionicons name="time-outline" size={18} color={colors.text.tertiary} />
        <Text style={[styles.inputText, !value && { color: colors.text.tertiary }]}>
          {value || 'HH:MM'}
        </Text>
      </Pressable>
    </View>
  );

  // ── Step 1: Route ──
  const renderStep1 = () => (
    <View>
      {renderInput('PICKUP LOCATION', pickup, setPickup, 'e.g. Mumbai Airport', 'location-outline')}
      {renderInput('DROP LOCATION', dropoff, setDropoff, 'e.g. Pune Station', 'location-outline')}

      {/* Journey Type */}
      <View style={styles.field}>
        <Text style={styles.label}>JOURNEY TYPE</Text>
        <View style={styles.row}>
          {(['ONE_WAY', 'ROUND_TRIP'] as JourneyType[]).map((jt) => (
            <Pressable
              key={jt}
              style={[styles.chipBtn, journeyType === jt && styles.chipBtnActive]}
              onPress={() => { hapticSelection(); setJourneyType(jt); }}
            >
              <Ionicons
                name={jt === 'ONE_WAY' ? 'arrow-forward' : 'swap-horizontal-outline'}
                size={16}
                color={journeyType === jt ? colors.text.inverse : colors.text.secondary}
              />
              <Text style={[styles.chipText, journeyType === jt && styles.chipTextActive]}>
                {jt === 'ONE_WAY' ? 'One Way' : 'Round Trip'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Pickup Date & Time */}
      <View style={styles.row}>
        {renderDateField('PICKUP DATE', pickupDate, 'pickupDate')}
        {renderTimeField('PICKUP TIME', pickupTime, 'pickupTime')}
      </View>

      {/* Return Date & Time */}
      {journeyType === 'ROUND_TRIP' && (
        <View style={styles.row}>
          {renderDateField('RETURN DATE', returnDate, 'returnDate')}
          {renderTimeField('RETURN TIME', returnTime, 'returnTime')}
        </View>
      )}

      <Pressable style={styles.primaryBtn} onPress={() => { if (validateStep1()) setStep(1); }}>
        <Text style={styles.primaryBtnText}>Next</Text>
        <Ionicons name="arrow-forward-outline" size={18} color={colors.text.inverse} />
      </Pressable>
    </View>
  );

  // ── Step 2: Package & Pricing ──
  const renderStep2 = () => {
    const showHours = packageType === 'HOURLY';
    const showDay = packageType === 'DAY_BASIS';
    const showFixed = packageType === 'FIXED';

    return (
      <View>
        {/* Package Cards */}
        <View style={styles.field}>
          <Text style={styles.label}>SELECT PACKAGE</Text>
          {loadingPackages ? (
            <ActivityIndicator size="small" color={colors.accent.primary} style={{ marginTop: spacing.md }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
              {packages.map((pkg) => (
                <Pressable
                  key={pkg.id}
                  style={[styles.pkgCard, selectedPackage?.id === pkg.id && styles.pkgCardActive]}
                  onPress={() => handlePackageSelect(pkg)}
                >
                  <Text style={[styles.pkgName, selectedPackage?.id === pkg.id && { color: colors.text.inverse }]} numberOfLines={1}>
                    {pkg.packageName || pkg.name}
                  </Text>
                  <Text style={[styles.pkgPrice, selectedPackage?.id === pkg.id && { color: colors.text.inverse }]}>
                    ₹{pkg.basePrice ?? pkg.baseRate ?? '—'}
                  </Text>
                  <Text style={[styles.pkgType, selectedPackage?.id === pkg.id && { color: colors.text.inverse, opacity: 0.8 }]}>
                    {(pkg.packageType || pkg.type || '').replace('_', ' ')}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                style={[styles.pkgCard, isCustom && styles.pkgCardActive]}
                onPress={handleCustomSelect}
              >
                <Ionicons name="add-circle-outline" size={22} color={isCustom ? colors.text.inverse : colors.accent.primary} />
                <Text style={[styles.pkgName, isCustom && { color: colors.text.inverse }]}>Custom</Text>
              </Pressable>
            </ScrollView>
          )}
        </View>

        {/* Package Type Selector */}
        <View style={styles.field}>
          <Text style={styles.label}>PACKAGE TYPE</Text>
          <View style={styles.row}>
            {(['HOURLY', 'DAY_BASIS', 'FIXED'] as PackageType[]).map((t) => (
              <Pressable
                key={t}
                style={[styles.chipBtn, { flex: 1 }, packageType === t && styles.chipBtnActive]}
                onPress={() => { hapticSelection(); setPackageType(t); }}
              >
                <Text style={[styles.chipText, packageType === t && styles.chipTextActive]}>
                  {t.replace('_', ' ')}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Cab Type */}
        {renderInput('CAB TYPE', cabType, setCabType, 'e.g. DZIRE, INNOVA', 'car-outline')}

        {/* Pricing fields based on type */}
        {showHours && (
          <>
            <View style={styles.row}>
              {renderInput('INCLUDED HOURS', includedHours, setIncludedHours, 'e.g. 4', 'time-outline', { keyboardType: 'number-pad' })}
              {renderInput('INCLUDED KM', includedKm, setIncludedKm, 'e.g. 40', 'speedometer-outline', { keyboardType: 'number-pad' })}
            </View>
            {renderInput('BASE PRICE (₹)', basePrice, setBasePrice, 'e.g. 1200', 'cash-outline', { keyboardType: 'number-pad' })}
            <View style={styles.row}>
              {renderInput('EXTRA KM (₹)', extraKmCharge, setExtraKmCharge, 'e.g. 14', 'add-circle-outline', { keyboardType: 'number-pad' })}
              {renderInput('EXTRA HOUR (₹)', extraHourCharge, setExtraHourCharge, 'e.g. 150', 'time-outline', { keyboardType: 'number-pad' })}
            </View>
          </>
        )}

        {showDay && (
          <>
            <View style={styles.row}>
              {renderInput('DAYS INCLUDED', daysIncluded, setDaysIncluded, 'e.g. 1', 'calendar-outline', { keyboardType: 'number-pad' })}
              {renderInput('INCLUDED KM', includedKm, setIncludedKm, 'e.g. 250', 'speedometer-outline', { keyboardType: 'number-pad' })}
            </View>
            {renderInput('BASE PRICE (₹)', basePrice, setBasePrice, 'e.g. 3500', 'cash-outline', { keyboardType: 'number-pad' })}
            <View style={styles.row}>
              {renderInput('EXTRA KM (₹)', extraKmCharge, setExtraKmCharge, 'e.g. 12', 'add-circle-outline', { keyboardType: 'number-pad' })}
              {renderInput('EXTRA DAY (₹)', extraDayPrice, setExtraDayPrice, 'e.g. 3500', 'calendar-outline', { keyboardType: 'number-pad' })}
            </View>
          </>
        )}

        {showFixed && (
          renderInput('TOTAL FIXED PRICE (₹)', totalFixedPrice, setTotalFixedPrice, 'e.g. 5000', 'cash-outline', { keyboardType: 'number-pad' })
        )}

        {/* Nav */}
        <View style={[styles.row, { marginTop: spacing.xxl }]}>
          <Pressable style={styles.secondaryBtn} onPress={() => setStep(0)}>
            <Ionicons name="arrow-back-outline" size={18} color={colors.text.secondary} />
            <Text style={styles.secondaryBtnText}>Back</Text>
          </Pressable>
          <Pressable style={styles.primaryBtn} onPress={() => { if (validateStep2()) setStep(2); }}>
            <Text style={styles.primaryBtnText}>Next</Text>
            <Ionicons name="arrow-forward-outline" size={18} color={colors.text.inverse} />
          </Pressable>
        </View>
      </View>
    );
  };

  // ── Step 3: Guest & Confirm ──
  const renderStep3 = () => (
    <View>
      {/* Guest Phone + Search */}
      <View style={styles.field}>
        <Text style={styles.label}>GUEST PHONE</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="call-outline" size={18} color={colors.text.tertiary} />
          <TextInput
            style={styles.input}
            placeholder="10-digit phone number"
            placeholderTextColor={colors.text.tertiary}
            value={guestPhone}
            onChangeText={(t) => { setGuestPhone(t); }}
            keyboardType="phone-pad"
            maxLength={10}
          />
          {guestPhone.length > 0 && (
            <Pressable onPress={() => { setGuestPhone(''); setGuestName(''); setShowGuestSuggestions(false); }}>
              <Ionicons name="close-circle-outline" size={20} color={colors.text.tertiary} />
            </Pressable>
          )}
        </View>
        {showGuestSuggestions && (
          <View style={styles.dropdown}>
            {guestSuggestions.map((g) => (
              <Pressable key={g.id} style={styles.dropdownItem} onPress={() => selectGuest(g)}>
                <Ionicons name="person-outline" size={16} color={colors.text.secondary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.dropdownText}>{g.name}</Text>
                  <Text style={styles.dropdownSub}>{g.phone || g.mobile}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {renderInput('GUEST NAME', guestName, setGuestName, 'Enter guest name', 'person-outline')}
      {renderInput('PASSENGERS (optional)', passengerCount, setPassengerCount, 'Number of passengers', 'people-outline', { keyboardType: 'number-pad' })}
      {renderInput('REMARKS (optional)', remarks, setRemarks, 'Special instructions, flight #, etc.', 'document-text-outline', { multiline: true })}

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Trip Summary</Text>
        <SummaryRow icon="location-outline" iconColor={colors.semantic.success} text={pickup || '—'} />
        <SummaryRow icon="location-outline" iconColor={colors.semantic.error} text={dropoff || '—'} />
        <SummaryRow icon="swap-horizontal-outline" text={journeyType === 'ONE_WAY' ? 'One Way' : 'Round Trip'} />
        <SummaryRow icon="calendar-outline" text={`${pickupDate} ${pickupTime}${journeyType === 'ROUND_TRIP' && returnDate ? ` → ${returnDate} ${returnTime}` : ''}`} />
        <View style={styles.divider} />
        <SummaryRow icon="briefcase-outline" text={selectedPackage?.name || (isCustom ? `Custom (${packageType.replace('_', ' ')})` : '—')} />
        <SummaryRow icon="cash-outline" text={`₹${packageType === 'FIXED' ? totalFixedPrice : basePrice || '—'}`} />
        {guestName && (
          <>
            <View style={styles.divider} />
            <SummaryRow icon="person-outline" text={guestName} />
            {guestPhone && <SummaryRow icon="call-outline" text={guestPhone} />}
          </>
        )}
      </View>

      {/* Nav */}
      <View style={[styles.row, { marginTop: spacing.xxl }]}>
        <Pressable style={styles.secondaryBtn} onPress={() => setStep(1)}>
          <Ionicons name="arrow-back-outline" size={18} color={colors.text.secondary} />
          <Text style={styles.secondaryBtnText}>Back</Text>
        </Pressable>
        <Pressable
          style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
          onPress={handleCreateBooking}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.text.inverse} />
          ) : (
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.text.inverse} />
          )}
          <Text style={styles.primaryBtnText}>{isSubmitting ? 'Creating...' : 'Create Booking'}</Text>
        </Pressable>
      </View>
    </View>
  );

  const SummaryRow = ({ icon, text, iconColor }: { icon: string; text: string; iconColor?: string }) => (
    <View style={styles.summaryRow}>
      <Ionicons name={icon as any} size={15} color={iconColor || colors.text.tertiary} />
      <Text style={styles.summaryText} numberOfLines={2}>{text}</Text>
    </View>
  );

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    setScrollPosition(contentOffset.y, contentSize.height, layoutMeasurement.height);
  };

  return (
    <View style={styles.screen}>
      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={64} color={colors.semantic.success} />
            <Text style={styles.successTitle}>Booking Created!</Text>
            <Text style={styles.successSub}>{guestName}</Text>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: insets.top + 80, paddingBottom: 120, padding: spacing.lg }}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step Indicator */}
          <View style={styles.stepRow}>
            {[0, 1, 2].map((i) => {
              const done = i < step;
              const cur = i === step;
              return (
                <Pressable key={i} onPress={() => { if (i < step) setStep(i); }} style={styles.stepItem}>
                  <View style={[styles.stepCircle, done && styles.stepDone, cur && styles.stepCur]}>
                    {done ? (
                      <Ionicons name="checkmark-outline" size={14} color={colors.text.inverse} />
                    ) : (
                      <Text style={[styles.stepNum, cur && { color: colors.accent.primary }]}>{i + 1}</Text>
                    )}
                  </View>
                  <Text style={[styles.stepLabel, (done || cur) && styles.stepLabelActive]}>
                    {STEP_LABELS[i]}
                  </Text>
                  {i < 2 && <View style={[styles.stepLine, done && { backgroundColor: colors.accent.primary }]} />}
                </Pressable>
              );
            })}
          </View>

          {step === 0 && renderStep1()}
          {step === 1 && renderStep2()}
          {step === 2 && renderStep3()}
          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>New Booking</Text>
        <Text style={styles.subtitle}>
          {step === 0 ? 'Plan your route' : step === 1 ? 'Select package & pricing' : 'Guest details & confirm'}
        </Text>
      </View>

      {/* Date/Time Picker (Android dialog) */}
      {pickerVisible && (
        <DateTimePicker
          value={new Date()}
          mode={pickerMode}
          is24Hour
          display="default"
          onChange={onPickerChange}
        />
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────

const createStyles = (colors: any, shadows: any, isDark: boolean) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg.base },

    header: {
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
      paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
      backgroundColor: colors.bg.base,
    },
    title: { ...typography.h3, color: colors.text.primary, fontWeight: '700' },
    subtitle: { ...typography.caption, color: colors.text.secondary, marginTop: 2 },

    // Step Indicator
    stepRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.xxl, paddingHorizontal: spacing.md },
    stepItem: { alignItems: 'center', flex: 1 },
    stepCircle: {
      width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.bg.surface, borderWidth: 2, borderColor: colors.border.subtle,
    },
    stepDone: { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary },
    stepCur: { borderColor: colors.accent.primary, backgroundColor: 'transparent' },
    stepNum: { ...typography.caption, color: colors.text.tertiary, fontWeight: '700' },
    stepLabel: { ...typography.caption, color: colors.text.tertiary, marginTop: spacing.xs, textAlign: 'center' },
    stepLabelActive: { color: colors.text.primary, fontWeight: '600' },
    stepLine: { position: 'absolute', top: 16, left: '60%', right: '-60%', height: 2, backgroundColor: colors.border.subtle },

    // Fields
    field: { marginBottom: spacing.lg },
    label: { ...typography.label, color: colors.text.tertiary, marginBottom: spacing.sm },
    inputWrap: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg.surface,
      borderRadius: radius.md, borderWidth: 1, borderColor: colors.border.subtle,
      paddingHorizontal: spacing.md, height: 48, gap: spacing.sm,
      ...(!isDark ? shadows.low : {}),
    },
    textAreaWrap: { height: 96, alignItems: 'flex-start', paddingTop: spacing.md },
    input: { flex: 1, ...typography.body, color: colors.text.primary },
    inputText: { ...typography.body, color: colors.text.primary, flex: 1 },
    row: { flexDirection: 'row', gap: spacing.md },

    // Chips (journey type, package type)
    chipBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm, paddingVertical: spacing.md, borderRadius: radius.md,
      backgroundColor: colors.bg.surface, borderWidth: 1, borderColor: colors.border.subtle,
    },
    chipBtnActive: { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary },
    chipText: { ...typography.bodyMedium, color: colors.text.secondary },
    chipTextActive: { color: colors.text.inverse },

    // Package cards
    pkgCard: {
      width: 130, padding: spacing.md, borderRadius: radius.md,
      backgroundColor: colors.bg.surface, borderWidth: 1, borderColor: colors.border.subtle, gap: 2,
    },
    pkgCardActive: { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary },
    pkgName: { ...typography.bodyMedium, color: colors.text.primary },
    pkgPrice: { ...typography.h3, color: colors.accent.primary },
    pkgType: { ...typography.caption, color: colors.text.secondary, textTransform: 'capitalize' },

    // Buttons
    primaryBtn: {
      flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm, paddingVertical: spacing.lg, borderRadius: radius.md,
      backgroundColor: colors.accent.primary,
    },
    primaryBtnText: { ...typography.bodyMedium, color: colors.text.inverse, fontWeight: '600' },
    secondaryBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm, paddingVertical: spacing.lg, borderRadius: radius.md,
      backgroundColor: colors.bg.surface, borderWidth: 1, borderColor: colors.border.subtle,
    },
    secondaryBtnText: { ...typography.bodyMedium, color: colors.text.secondary },
    submitBtn: {
      flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm, paddingVertical: spacing.lg, borderRadius: radius.md,
      backgroundColor: colors.semantic.success,
    },

    // Guest dropdown
    dropdown: {
      backgroundColor: colors.bg.surface, borderRadius: radius.md,
      borderWidth: 1, borderColor: colors.border.subtle, marginTop: spacing.xs, overflow: 'hidden',
    },
    dropdownItem: {
      flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm,
      borderBottomWidth: 1, borderBottomColor: colors.border.subtle,
    },
    dropdownText: { ...typography.body, color: colors.text.primary },
    dropdownSub: { ...typography.caption, color: colors.text.secondary },

    // Summary
    summaryCard: {
      backgroundColor: colors.bg.surface, borderRadius: radius.md, borderWidth: 1,
      borderColor: colors.border.subtle, padding: spacing.lg, marginTop: spacing.lg,
      ...(!isDark ? shadows.low : {}),
    },
    summaryTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.md },
    summaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    summaryText: { ...typography.body, color: colors.text.primary, flex: 1 },
    divider: { height: 1, backgroundColor: colors.border.subtle, marginVertical: spacing.md },

    // Success modal
    successOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
    successCard: {
      backgroundColor: colors.bg.elevated || '#1C1C1C', borderRadius: 24, padding: 32,
      alignItems: 'center', gap: 16, elevation: 12,
    },
    successTitle: { ...typography.h2, color: colors.text.primary, fontWeight: '700', textAlign: 'center' },
    successSub: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },
  });
