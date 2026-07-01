/**
 * Secure Keyboard Module — OS secure keyboard integration
 * 
 * Detects and utilizes OS-provided secure keyboards.
 * Configures TextInput fields for maximum security.
 */

import { Platform, TextInputProps, KeyboardTypeOptions } from 'react-native';

// ============================================
// TYPES
// ============================================

export interface SecureKeyboardConfig {
  useSecureTextInput: boolean;
  keyboardType: KeyboardTypeOptions;
  textContentType?: string;
  autoComplete?: TextInputProps['autoComplete'];
  secureTextEntry?: boolean;
  autoCorrect?: boolean;
  spellCheck?: boolean;
}

export interface SecureKeyboardInfo {
  isAvailable: boolean;
  provider: string;
  features: string[];
}

// ============================================
// SECURE KEYBOARD CLASS
// ============================================

export class SecureKeyboard {
  private isSamsungDevice: boolean = false;
  private isGoogleDevice: boolean = false;
  private isAppleDevice: boolean = false;

  constructor() {
    this.detectDevice();
  }

  /**
   * Detect device type for keyboard selection
   */
  private detectDevice(): void {
    // In production, use device info to detect manufacturer
    // This is simplified for React Native
    if (Platform.OS === 'ios') {
      this.isAppleDevice = true;
    } else if (Platform.OS === 'android') {
      // Android - could be Samsung, Google, etc.
      // In production, check Device.manufacturer
      this.isGoogleDevice = true;
    }
  }

  /**
   * Get secure keyboard information
   */
  getSecureKeyboardInfo(): SecureKeyboardInfo {
    if (Platform.OS === 'ios') {
      return {
        isAvailable: true,
        provider: 'Apple Secure Keyboard',
        features: [
          'AutoFill support',
          'Strong Password generation',
          'Two-factor code detection',
          'Secure text entry',
        ],
      };
    }

    if (Platform.OS === 'android') {
      // Check for Samsung Secure Keyboard
      if (this.isSamsungDevice) {
        return {
          isAvailable: true,
          provider: 'Samsung Secure Keyboard',
          features: [
            'Secure input mode',
            'Screen capture prevention',
            'Keylogger protection',
            'Clipboard protection',
          ],
        };
      }

      // Google Gboard or default
      return {
        isAvailable: true,
        provider: 'Android Secure Input',
        features: [
          'Incognito keyboard mode',
          'AutoFill support',
          'Secure text entry',
        ],
      };
    }

    return {
      isAvailable: false,
      provider: 'Unknown',
      features: [],
    };
  }

  /**
   * Check if secure keyboard is available
   */
  isSecureKeyboardAvailable(): boolean {
    return this.getSecureKeyboardInfo().isAvailable;
  }

  /**
   * Get TextInput props for password fields
   */
  getPasswordFieldProps(): Partial<TextInputProps> {
    return {
      secureTextEntry: true,
      autoComplete: 'password',
      textContentType: Platform.OS === 'ios' ? 'password' : undefined,
      keyboardType: 'default',
      autoCorrect: false,
      spellCheck: false,
      autoCapitalize: 'none',
      importantForAutofill: 'yes',
    };
  }

  /**
   * Get TextInput props for username/email fields
   */
  getUsernameFieldProps(): Partial<TextInputProps> {
    return {
      secureTextEntry: false,
      autoComplete: 'username',
      textContentType: Platform.OS === 'ios' ? 'username' : undefined,
      keyboardType: 'email-address',
      autoCorrect: false,
      spellCheck: false,
      autoCapitalize: 'none',
      importantForAutofill: 'yes',
    };
  }

  /**
   * Get TextInput props for OTP/verification code fields
   */
  getOTPFieldProps(): Partial<TextInputProps> {
    return {
      secureTextEntry: true,
      autoComplete: Platform.OS === 'ios' ? 'one-time-code' : 'sms-otp',
      textContentType: Platform.OS === 'ios' ? 'oneTimeCode' : undefined,
      keyboardType: 'number-pad',
      autoCorrect: false,
      spellCheck: false,
      autoCapitalize: 'none',
      maxLength: 6,
      importantForAutofill: 'yes',
    };
  }

  /**
   * Get TextInput props for credit card fields
   */
  getCreditCardFieldProps(): Partial<TextInputProps> {
    return {
      secureTextEntry: false,
      autoComplete: 'cc-number',
      textContentType: Platform.OS === 'ios' ? 'creditCardNumber' : undefined,
      keyboardType: 'number-pad',
      autoCorrect: false,
      spellCheck: false,
      autoCapitalize: 'none',
      importantForAutofill: 'yes',
    };
  }

  /**
   * Get TextInput props for sensitive general input
   */
  getSensitiveFieldProps(): Partial<TextInputProps> {
    return {
      secureTextEntry: true,
      autoComplete: 'off',
      textContentType: 'none',
      keyboardType: 'default',
      autoCorrect: false,
      spellCheck: false,
      autoCapitalize: 'none',
      importantForAutofill: 'no',
    };
  }

  /**
   * Get secure keyboard configuration for field type
   */
  getSecureConfig(fieldType: 'password' | 'username' | 'otp' | 'creditcard' | 'sensitive'): SecureKeyboardConfig {
    switch (fieldType) {
      case 'password':
        return {
          useSecureTextInput: true,
          keyboardType: 'default',
          textContentType: Platform.OS === 'ios' ? 'password' : undefined,
          autoComplete: 'password',
          secureTextEntry: true,
          autoCorrect: false,
          spellCheck: false,
        };

      case 'username':
        return {
          useSecureTextInput: false,
          keyboardType: 'email-address',
          textContentType: Platform.OS === 'ios' ? 'username' : undefined,
          autoComplete: 'username',
          secureTextEntry: false,
          autoCorrect: false,
          spellCheck: false,
        };

      case 'otp':
        return {
          useSecureTextInput: true,
          keyboardType: 'number-pad',
          textContentType: Platform.OS === 'ios' ? 'oneTimeCode' : undefined,
          autoComplete: Platform.OS === 'ios' ? 'one-time-code' : 'sms-otp',
          secureTextEntry: true,
          autoCorrect: false,
          spellCheck: false,
        };

      case 'creditcard':
        return {
          useSecureTextInput: false,
          keyboardType: 'number-pad',
          textContentType: Platform.OS === 'ios' ? 'creditCardNumber' : undefined,
          autoComplete: 'cc-number',
          secureTextEntry: false,
          autoCorrect: false,
          spellCheck: false,
        };

      case 'sensitive':
        return {
          useSecureTextInput: true,
          keyboardType: 'default',
          textContentType: 'none',
          autoComplete: 'off',
          secureTextEntry: true,
          autoCorrect: false,
          spellCheck: false,
        };

      default:
        return {
          useSecureTextInput: false,
          keyboardType: 'default',
          autoComplete: 'off',
          secureTextEntry: false,
          autoCorrect: false,
          spellCheck: false,
        };
    }
  }

  /**
   * Merge secure config with custom TextInput props
   */
  mergeWithSecureProps(
    customProps: Partial<TextInputProps>,
    fieldType: 'password' | 'username' | 'otp' | 'creditcard' | 'sensitive'
  ): Partial<TextInputProps> {
    const secureConfig = this.getSecureConfig(fieldType);

    return {
      ...secureConfig,
      ...customProps,
      // Ensure security props are not overridden
      secureTextEntry: secureConfig.secureTextEntry,
      autoComplete: secureConfig.autoComplete,
      textContentType: secureConfig.textContentType,
      autoCorrect: secureConfig.autoCorrect,
      spellCheck: secureConfig.spellCheck,
    };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let secureKeyboardInstance: SecureKeyboard | null = null;

export function getSecureKeyboard(): SecureKeyboard {
  if (!secureKeyboardInstance) {
    secureKeyboardInstance = new SecureKeyboard();
  }
  return secureKeyboardInstance;
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Get secure TextInput props for password field
 */
export function getPasswordTextInputProps(): Partial<TextInputProps> {
  return getSecureKeyboard().getPasswordFieldProps();
}

/**
 * Get secure TextInput props for username field
 */
export function getUsernameTextInputProps(): Partial<TextInputProps> {
  return getSecureKeyboard().getUsernameFieldProps();
}

/**
 * Get secure TextInput props for OTP field
 */
export function getOTPTextInputProps(): Partial<TextInputProps> {
  return getSecureKeyboard().getOTPFieldProps();
}

/**
 * Get secure TextInput props for credit card field
 */
export function getCreditCardTextInputProps(): Partial<TextInputProps> {
  return getSecureKeyboard().getCreditCardFieldProps();
}

/**
 * Get secure TextInput props for sensitive field
 */
export function getSensitiveTextInputProps(): Partial<TextInputProps> {
  return getSecureKeyboard().getSensitiveFieldProps();
}

/**
 * Check if secure keyboard is available
 */
export function isSecureKeyboardAvailable(): boolean {
  return getSecureKeyboard().isSecureKeyboardAvailable();
}

/**
 * Get secure keyboard information
 */
export function getSecureKeyboardInfo(): SecureKeyboardInfo {
  return getSecureKeyboard().getSecureKeyboardInfo();
}

/**
 * Create secure TextInput props with overrides
 */
export function createSecureTextInputProps(
  fieldType: 'password' | 'username' | 'otp' | 'creditcard' | 'sensitive',
  overrides?: Partial<TextInputProps>
): Partial<TextInputProps> {
  return getSecureKeyboard().mergeWithSecureProps(overrides || {}, fieldType);
}

export default {
  SecureKeyboard,
  getSecureKeyboard,
  getPasswordTextInputProps,
  getUsernameTextInputProps,
  getOTPTextInputProps,
  getCreditCardTextInputProps,
  getSensitiveTextInputProps,
  isSecureKeyboardAvailable,
  getSecureKeyboardInfo,
  createSecureTextInputProps,
};
