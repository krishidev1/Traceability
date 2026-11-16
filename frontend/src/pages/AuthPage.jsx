import { useEffect, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { FaGoogle } from "react-icons/fa";
import { X as LucideX } from "lucide-react";
import { authApi } from "../api/traceabilityApi";
import { useAuth, useRouter } from "../shared/AuthContext";
import { LoadingIndicator } from "../components/Others";
import { API_URL, TRACE_CONNECT_LOGO_SRC, delay } from "../utils/traceConnectConstants";
import "../styles/AuthPage.css";

const ACCOUNT_TYPE_OPTIONS = [
  { value: "grower", label: "Grower" },
  { value: "supplier", label: "Supplier" },
];

export default function AuthEntryPage({ toast, modal = false, onClose, initialMode = "login" }) {
  const { login, signup, resetPassword, setRememberAuth } = useAuth();
  const { navigate } = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [signupStep, setSignupStep] = useState(0);
  const [accountType, setAccountType] = useState("grower");
  const [fullName, setFullName] = useState("");
  const [profileType, setProfileType] = useState("individual");
  const [organisationName, setOrganisationName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [mobileVerificationToken, setMobileVerificationToken] = useState("");
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailVerificationToken, setEmailVerificationToken] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [locationFocused, setLocationFocused] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [gstin, setGstin] = useState("");
  const [gstRegisteredPhone, setGstRegisteredPhone] = useState("");
  const [gstPhoneOtp, setGstPhoneOtp] = useState("");
  const [gstOtpSent, setGstOtpSent] = useState(false);
  const [gstPhoneVerificationToken, setGstPhoneVerificationToken] = useState("");
  const [giRegistryDocument, setGiRegistryDocument] = useState("");
  const [giDocumentName, setGiDocumentName] = useState("");
  const [giConsent, setGiConsent] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [stepLoading, setStepLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [otpBusy, setOtpBusy] = useState("");
  const authPanelRef = useRef(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  const isSignup = mode === "signup";
  const isWorking = busy || stepLoading || fileLoading || Boolean(otpBusy);
  const phoneIsValid = /^\+?[1-9]\d{9,14}$/.test(phone.replace(/[^\d+]/g, ""));
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordChecks = [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "Lowercase letter", valid: /[a-z]/.test(password) },
    { label: "Uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "Number", valid: /\d/.test(password) },
    { label: "Symbol", valid: /[^A-Za-z0-9]/.test(password) },
  ];
  const passwordScore = passwordChecks.filter((check) => check.valid).length;
  const passwordStrength = passwordScore === 5 ? "strong" : passwordScore >= 3 ? "fair" : "weak";
  const kycComplete = Boolean(
    fullName.trim()
    && phoneIsValid
    && emailIsValid
    && Boolean(selectedLocation)
    && Boolean(selectedLocation.address?.country)
    && profileImage
    && (aadhaarNumber.trim() === "" || /^\d{12}$/.test(aadhaarNumber.replace(/\D/g, "")))
    && passwordStrength === "strong"
    && password === confirmPassword,
  );
  // GSTIN/KYB verification is optional until the verification workflow is re-enabled.
  const kybComplete = true;
  const giComplete = Boolean(giRegistryDocument && giConsent);
  const completionPercent = (kycComplete ? 50 : 0) + (kybComplete ? 25 : 0) + (giComplete ? 25 : 0);

  useEffect(() => {
    const query = locationSearch.trim();
    if (signupStep !== 1 || selectedLocation || query.length < 3) return undefined;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLocationLoading(true);
      try {
        const params = new URLSearchParams({
          format: "jsonv2",
          addressdetails: "1",
          limit: "6",
          q: query,
        });
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
          signal: controller.signal,
          headers: { "Accept-Language": "en" },
        });
        if (!response.ok) throw new Error("Location search is unavailable.");
        const results = await response.json();
        setLocationSuggestions(Array.isArray(results) ? results : []);
      } catch (err) {
        if (err?.name !== "AbortError") {
          setLocationSuggestions([]);
          setError(err?.message || "Unable to load location suggestions.");
        }
      } finally {
        if (!controller.signal.aborted) setLocationLoading(false);
      }
    }, 700);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [locationSearch, selectedLocation, signupStep]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setSignupStep(0);
    setError("");
    setStepLoading(false);
    window.setTimeout(() => authPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 0);
  };

  const goToSignupStep = (nextStep) => {
    setStepLoading(true);
    window.setTimeout(() => {
      setSignupStep(nextStep);
      setStepLoading(false);
      setLocationFocused(false);
      setLocationSuggestions([]);
      setLocationLoading(false);
      authPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, 280);
  };

  const readSignupFile = (event, expectedType, setValue, label) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = Array.isArray(expectedType) ? expectedType : [expectedType];
    const allowedExtensions = allowedTypes.map((type) => ({
      "image/png": ".png",
      "image/jpeg": ".jpg",
      "image/webp": ".webp",
      "application/pdf": ".pdf",
    })[type]);
    const extensionIndex = allowedExtensions.findIndex((ext) => file.name.toLowerCase().endsWith(ext));
    const detectedType = allowedTypes.includes(file.type) ? file.type : allowedTypes[extensionIndex];
    const typeIsValid = allowedTypes.includes(file.type) || allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!typeIsValid) {
      event.target.value = "";
      setValue("");
      setError(`${label} must be a supported image or PDF file.`);
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      event.target.value = "";
      setValue("");
      setError(`${label} must be 5 MB or smaller.`);
      return false;
    }
    setError("");
    setFileLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setValue(String(reader.result || "").replace(/^data:[^;]+;/, `data:${detectedType};`));
      setFileLoading(false);
    };
    reader.onerror = () => {
      setFileLoading(false);
      const message = `Unable to read ${label.toLowerCase()}.`;
      setError(message);
      toast(message, "error");
    };
    reader.readAsDataURL(file);
    return true;
  };

  const sendPhoneOtp = async (purpose, targetPhone) => {
    const valid = /^\+?[1-9]\d{9,14}$/.test(targetPhone.replace(/[^\d+]/g, ""));
    if (!valid) {
      setError("Enter a valid mobile number before requesting an OTP.");
      return;
    }
    setError("");
    setOtpBusy(purpose);
    try {
      await authApi.sendSignupPhoneOtp({ phone: targetPhone, purpose });
      if (purpose === "mobile") {
        setPhoneOtpSent(true);
        setPhoneOtp("");
        setMobileVerificationToken("");
      } else {
        setGstOtpSent(true);
        setGstPhoneOtp("");
        setGstPhoneVerificationToken("");
      }
      toast("Verification code sent by SMS.", "success");
    } catch (err) {
      const message = err?.message || "Unable to send SMS verification code.";
      setError(message);
      toast(message, "error");
    } finally {
      setOtpBusy("");
    }
  };

  const verifyPhoneOtp = async (purpose, targetPhone, code) => {
    if (!/^\d{4,8}$/.test(code.trim())) {
      setError("Enter the verification code sent to your mobile number.");
      return;
    }
    setError("");
    setOtpBusy(`${purpose}-verify`);
    try {
      const result = await authApi.verifySignupPhoneOtp({
        phone: targetPhone,
        purpose,
        code: code.trim(),
      });
      if (purpose === "mobile") setMobileVerificationToken(result.verification_token);
      else setGstPhoneVerificationToken(result.verification_token);
      toast("Mobile number verified.", "success");
    } catch (err) {
      const message = err?.message || "Unable to verify mobile number.";
      setError(message);
      toast(message, "error");
    } finally {
      setOtpBusy("");
    }
  };

  const sendEmailOtp = async () => {
    if (!emailIsValid) {
      setError("Enter a valid email address before requesting an OTP.");
      return;
    }
    setError("");
    setOtpBusy("email");
    try {
      await authApi.sendSignupEmailOtp(email.trim());
      setEmailOtpSent(true);
      setEmailOtp("");
      setEmailVerificationToken("");
      toast("Verification code sent to your email.", "success");
    } catch (err) {
      const message = err?.message || "Unable to send email verification code.";
      setError(message);
      toast(message, "error");
    } finally {
      setOtpBusy("");
    }
  };

  const verifyEmailOtp = async () => {
    if (!/^\d{4,8}$/.test(emailOtp.trim())) {
      setError("Enter the verification code sent to your email.");
      return;
    }
    setError("");
    setOtpBusy("email-verify");
    try {
      const result = await authApi.verifySignupEmailOtp({
        email: email.trim(),
        code: emailOtp.trim(),
      });
      setEmailVerificationToken(result.verification_token);
      toast("Email address verified.", "success");
    } catch (err) {
      const message = err?.message || "Unable to verify email address.";
      setError(message);
      toast(message, "error");
    } finally {
      setOtpBusy("");
    }
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      setRememberAuth(rememberMe);
      const [authedUser] = await Promise.all([
        login({ identifier: loginIdentifier, password: loginPassword }, rememberMe),
        delay(550),
      ]);
      toast("Logged in successfully");
      window.location.hash = authedUser?.role === "admin" ? "/admin" : authedUser?.role === "supplier" ? "/supplier" : "/grower";
    } catch (err) {
      const message = err?.message || "Authentication failed";
      setError(message);
      toast(message, "error");
    } finally {
      setBusy(false);
    }
  };

  const submitSignup = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const [authedUser] = await Promise.all([
        signup({
          account_type: accountType,
          full_name: fullName,
          profile_type: profileType,
          organisation_name: profileType === "organisation" ? organisationName : "",
          phone,
          email,
          password,
          confirm_password: confirmPassword,
          profile_image: profileImage,
          company_logo: companyLogo || null,
          aadhaar_number: aadhaarNumber,
          profile_location: selectedLocation.display_name,
          location_area: selectedLocation.address?.village
            || selectedLocation.address?.suburb
            || selectedLocation.address?.neighbourhood
            || selectedLocation.address?.hamlet
            || selectedLocation.address?.city_district
            || selectedLocation.address?.city
            || selectedLocation.address?.town
            || "",
          location_district: selectedLocation.address?.county || selectedLocation.address?.municipality || "",
          location_state: selectedLocation.address?.state || "",
          location_country: selectedLocation.address?.country || "",
          email_verification_token: emailVerificationToken,
          mobile_verification_token: mobileVerificationToken,
          gstin: gstin.trim().toUpperCase(),
          gst_registered_phone: gstRegisteredPhone,
          gst_mobile_verification_token: gstPhoneVerificationToken,
          gi_registry_document: giRegistryDocument,
          gi_registry_document_name: giDocumentName,
        }),
        delay(650),
      ]);
      toast("Profile created successfully. Document verification takes 2–3 days. Check your status in Profile.", "success");
      window.location.hash = authedUser?.role === "admin" ? "/admin" : authedUser?.role === "supplier" ? "/supplier" : "/grower";
    } catch (err) {
      const message = err?.message || "Signup failed";
      setError(message);
      toast(message, "error");
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    setResetEmail(loginIdentifier.includes("@") ? loginIdentifier : "");
    setResetPasswordValue("");
    setResetConfirmPassword("");
    setForgotOpen(true);
    setError("");
  };

  const submitPasswordReset = async (event) => {
    event.preventDefault();
    if (resetPasswordValue !== resetConfirmPassword) {
      const message = "Password and confirm password do not match.";
      toast(message, "error");
      return;
    }
    setResetBusy(true);
    try {
      await resetPassword({ email: resetEmail, password: resetPasswordValue, confirm_password: resetConfirmPassword });
      toast("Password reset successfully", "success");
      setForgotOpen(false);
      setLoginIdentifier(resetEmail);
      setLoginPassword("");
    } catch (err) {
      toast(err?.message || "Unable to reset password", "error");
    } finally {
      setResetBusy(false);
    }
  };

  const submitSignupStep = (event) => {
    event.preventDefault();
    setError("");
    if (signupStep === 0) {
      goToSignupStep(1);
      return;
    }

    if (signupStep === 1) {
      if (!fullName.trim()) return setError("Enter your full name.");
      if (profileType === "organisation" && !organisationName.trim()) return setError("Enter your organisation name.");
      if (!phoneIsValid) return setError("Enter a valid mobile number.");
      if (!emailIsValid) return setError("Enter a valid email address.");
      if (aadhaarNumber.trim() && !/^\d{12}$/.test(aadhaarNumber.replace(/\D/g, ""))) {
        return setError("Aadhaar number must contain 12 digits.");
      }
      if (!selectedLocation) return setError("Search for and select your country, state, city, or area.");
      if (!selectedLocation.address?.country) return setError("Select a suggestion that includes a country.");
      if (!profileImage) return setError("Upload your profile image as a PNG file.");
      if (passwordStrength !== "strong") return setError("Your password must meet all five strength criteria.");
      if (password !== confirmPassword) return setError("Password and confirm password do not match.");
      goToSignupStep(2);
      return;
    }

    if (signupStep === 2) {
      goToSignupStep(3);
      return;
    }

    if (giRegistryDocument && !giConsent) return setError("Confirm that TraceConnect may share this document for verification.");
    if (signupStep < 3) {
      goToSignupStep(signupStep + 1);
      return;
    }
    submitSignup(event);
  };

  return (
    <div className={`auth-entry-page page-container ${modal ? "auth-entry-modal" : ""}`}>
      <div className="auth-modal">
        {modal && (
          <button className="auth-popup-close" onClick={onClose} type="button" aria-label="Close login popup">
            <LucideX aria-hidden="true" />
          </button>
        )}
        <aside className="auth-welcome-panel">
          <div className="auth-welcome-brand" onClick={() => navigate("/")} role="button" tabIndex={0}>
            <img src={TRACE_CONNECT_LOGO_SRC} alt="TraceConnect Logo" />
            <span>TraceConnect</span>
          </div>
        </aside>
        <div className="auth-right-panel" ref={authPanelRef}>
          <div className="auth-form-brand" onClick={() => navigate("/")} role="button" tabIndex={0}>
            <img src={TRACE_CONNECT_LOGO_SRC} alt="TraceConnect Logo" />
            <span>TRACECONNECT</span>
          </div>
          {forgotOpen && (
            <div className="auth-reset-panel">
              <div className="auth-reset-header">
                <h3>Reset password</h3>
              </div>
              <p className="auth-reset-help">Enter your registered email and choose a new password.</p>
              <form onSubmit={submitPasswordReset}>
                <label className="auth-input-wrap">
                  <span className="auth-field-label">Email address</span>
                  <input className="input" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="Enter email address" required />
                </label>
                <label className="auth-input-wrap">
                  <span className="auth-field-label">New password</span>
                  <input className="input" type="password" value={resetPasswordValue} onChange={(e) => setResetPasswordValue(e.target.value)} placeholder="Enter new password" minLength={8} required />
                </label>
                <label className="auth-input-wrap">
                  <span className="auth-field-label">Confirm password</span>
                  <input className="input" type="password" value={resetConfirmPassword} onChange={(e) => setResetConfirmPassword(e.target.value)} placeholder="Retype new password" minLength={8} required />
                </label>
                <button className="auth-submit-btn" disabled={resetBusy} type="submit">{resetBusy ? "Updating..." : "Set password"}</button>
              </form>
            </div>
          )}
          {!forgotOpen && <>
          <h2>{isSignup ? "Create account" : "Welcome back"}</h2>
          {!isSignup ? (
            <form onSubmit={submitLogin}>
              <label className="auth-input-wrap">
                <span className="auth-field-label">Email address / mobile number</span>
                <input className="input" value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} placeholder="you@example.com or mobile number" required />
              </label>

              <label className="auth-input-wrap">
                <span className="auth-field-label">Password</span>
                <input className="input" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Password" required />
              </label>

              <div className="auth-forgot-row">
                <button className="auth-forgot" onClick={handleForgotPassword} type="button">Forgot password?</button>
              </div>

              <label className="auth-remember-row">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span>Remember me</span>
              </label>

              {error && <div className="auth-error">{error}</div>}

              <button className="auth-submit-btn" disabled={isWorking} type="submit">
                {busy ? <LoadingIndicator label="Logging in..." /> : "Login"}
              </button>

              <div className="auth-or">or</div>
              <a className="auth-social-btn google" href={`${API_URL}/api/auth/google`}>
                <FaGoogle aria-hidden="true" />
                Continue with Google
              </a>
            </form>
          ) : (
            <form onSubmit={submitSignupStep} noValidate>
              {signupStep === 0 ? (
                <div className="auth-account-select-panel">
                  <label className="auth-input-wrap">
                    <span className="auth-field-label">Account type</span>
                    <span className="auth-select-wrap">
                      <select className="input" value={accountType} onChange={(e) => setAccountType(e.target.value)} disabled={isWorking} required>
                        {ACCOUNT_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <FiChevronDown />
                    </span>
                  </label>
                  {error && <div className="auth-error">{error}</div>}
                  <div className="auth-step-actions">
                    <button className="auth-submit-btn" disabled={isWorking} type="submit">Continue</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="auth-progress-heading">
                    <strong>Profile completion</strong>
                    <strong>{completionPercent}%</strong>
                  </div>
                  <div className="auth-progress-track" role="progressbar" aria-valuenow={completionPercent} aria-valuemin="0" aria-valuemax="100">
                    <span style={{ width: `${completionPercent}%` }} />
                  </div>
                  <div className="auth-weighted-steps">
                    <span className={kycComplete ? "complete" : signupStep === 1 ? "current" : ""}><b>Step 1: KYC</b><small>50%</small></span>
                    <span className={kybComplete ? "complete" : signupStep === 2 ? "current" : ""}><b>Step 2: KYB</b><small>25%</small></span>
                    <span className={giComplete ? "complete" : signupStep === 3 ? "current" : ""}><b>Step 3: GI Registry</b><small>25%</small></span>
                  </div>

                  {signupStep === 1 && (
                    <section className="auth-signup-stage">
                      <h3><strong>Step 1: KYC (Know Your Customer)</strong></h3>
                      <label className="auth-input-wrap">
                        <span className="auth-field-label">Full name</span>
                        <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" disabled={isWorking} required />
                      </label>
                      <label className="auth-input-wrap">
                        <span className="auth-field-label">Profile type</span>
                        <select className="input" value={profileType} onChange={(e) => setProfileType(e.target.value)} disabled={isWorking}>
                          <option value="individual">Individual</option>
                          <option value="organisation">Organisation</option>
                        </select>
                      </label>
                      {profileType === "organisation" && <label className="auth-input-wrap">
                        <span className="auth-field-label">Organisation name</span>
                        <input className="input" value={organisationName} onChange={(e) => setOrganisationName(e.target.value)} placeholder="Enter organisation name" disabled={isWorking} required />
                      </label>}

                      <div className="auth-input-wrap">
                        <label className="auth-field-label" htmlFor="signup-mobile">Mobile number</label>
                        <div className="auth-verify-row auth-otp-disabled-row">
                           <input id="signup-mobile" className="input" type="tel" inputMode="tel" value={phone} onChange={(e) => {
                            setPhone(e.target.value);
                          }} placeholder="Enter mobile number" disabled={isWorking} required />
                        </div>
                      </div>
                      {phoneOtpSent && !mobileVerificationToken && (
                        <div className="auth-verify-row">
                          <input className="input" inputMode="numeric" autoComplete="one-time-code" value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="Mobile OTP" aria-label="Mobile verification code" />
                          <button className="auth-verify-btn" onClick={() => verifyPhoneOtp("mobile", phone, phoneOtp)} type="button" disabled={isWorking}>
                            {otpBusy === "mobile-verify" ? "Verifying..." : "Verify"}
                          </button>
                        </div>
                      )}
                      {mobileVerificationToken && <p className="auth-verified-message">Mobile number verified.</p>}

                       <div className="auth-input-wrap">
                        <label className="auth-field-label" htmlFor="signup-email">Email address</label>
                         <div className="auth-verify-row auth-otp-disabled-row">
                          <input id="signup-email" className="input" type="email" value={email} onChange={(e) => {
                            setEmail(e.target.value.toLowerCase());
                          }} placeholder="Enter email address" disabled={isWorking} required />
                        </div>
                      </div>
                      {emailOtpSent && !emailVerificationToken && (
                        <div className="auth-verify-row">
                          <input className="input" inputMode="numeric" autoComplete="one-time-code" value={emailOtp} onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="Email OTP" aria-label="Email verification code" />
                          <button className="auth-verify-btn" onClick={verifyEmailOtp} type="button" disabled={isWorking}>
                            {otpBusy === "email-verify" ? "Verifying..." : "Verify"}
                          </button>
                        </div>
                      )}
                      {emailVerificationToken && <p className="auth-verified-message">Email address verified.</p>}

                      <label className="auth-input-wrap">
                        <span className="auth-field-label">Aadhaar number</span>
                        <input className="input" type="password" inputMode="numeric" autoComplete="off" maxLength={12} value={aadhaarNumber} onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, "").slice(0, 12))} placeholder="12-digit Aadhaar number" disabled={isWorking} />
                        <small className="auth-field-help">You can leave this field empty. If provided, it is stored encrypted.</small>
                      </label>

                      <div className="auth-input-wrap">
                        <label className="auth-field-label" htmlFor="signup-location">Country, state, city, or area</label>
                        <div className="auth-combobox">
                          <input
                            id="signup-location"
                            className="input"
                            value={locationSearch}
                            onBlur={() => window.setTimeout(() => setLocationFocused(false), 120)}
                            onChange={(event) => {
                              setLocationSearch(event.target.value);
                              setSelectedLocation(null);
                              setLocationSuggestions([]);
                              setLocationLoading(false);
                              setLocationFocused(true);
                              setError("");
                            }}
                            onFocus={() => setLocationFocused(true)}
                            placeholder="Search a country, state, city, or area"
                            autoComplete="off"
                            disabled={isWorking}
                            required
                          />
                          {locationFocused && (locationLoading || locationSuggestions.length > 0) && (
                            <div className="auth-suggestion-menu auth-location-suggestion-menu">
                              {locationLoading && <div className="auth-suggestion-status">Searching locations...</div>}
                              {!locationLoading && locationSuggestions.map((result) => (
                                <button
                                  key={result.place_id}
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => {
                                    setSelectedLocation(result);
                                    setLocationSearch(result.display_name);
                                    setLocationFocused(false);
                                    setLocationSuggestions([]);
                                    setLocationLoading(false);
                                    setError("");
                                  }}
                                  type="button"
                                >
                                  {result.display_name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <small className="auth-field-help">
                          {selectedLocation ? "Location selected." : "Type at least 3 characters, then select a matching suggestion."}
                        </small>
                        {locationSearch && !selectedLocation && !locationLoading && locationSuggestions.length === 0 && (
                          <small className="auth-inline-error">Choose a suggested location to continue.</small>
                        )}
                      </div>

                      <label className="auth-input-wrap">
                        <span className="auth-field-label">Profile image</span>
                        <input className="input" type="file" accept="image/png,.png" onChange={(e) => readSignupFile(e, "image/png", setProfileImage, "Profile image")} disabled={isWorking} required={!profileImage} />
                        <small className="auth-field-help">Upload a PNG image up to 5 MB.</small>
                      </label>
                      {profileImage && <div className="auth-photo-preview"><img src={profileImage} alt="Profile preview" /></div>}

                      <label className="auth-input-wrap">
                        <span className="auth-field-label">Company logo</span>
                        <input
                          className="input"
                          type="file"
                          accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                          onChange={(event) => readSignupFile(event, ["image/png", "image/jpeg", "image/webp"], setCompanyLogo, "Company logo")}
                          disabled={isWorking}
                        />
                        <small className="auth-field-help">Upload PNG, JPG, or WebP up to 5 MB, or leave blank.</small>
                      </label>
                      {companyLogo && <div className="auth-photo-preview"><img src={companyLogo} alt="Company logo preview" /></div>}

                      <label className="auth-input-wrap">
                        <span className="auth-field-label">Create password</span>
                        <input className="input" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a strong password" disabled={isWorking} required />
                      </label>
                      {password && (
                        <div className={`auth-password-strength ${passwordStrength}`}>
                          <div><strong>Password strength: {passwordStrength}</strong><span>{passwordScore}/5</span></div>
                          <div className="auth-password-meter"><span style={{ width: `${passwordScore * 20}%` }} /></div>
                          <ul>
                            {passwordChecks.map((check) => <li className={check.valid ? "valid" : ""} key={check.label}>{check.valid ? "✓" : "○"} {check.label}</li>)}
                          </ul>
                        </div>
                      )}
                      <label className="auth-input-wrap">
                        <span className="auth-field-label">Confirm password</span>
                        <input className="input" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" disabled={isWorking} required />
                      </label>
                      {confirmPassword && password !== confirmPassword && <p className="auth-inline-error">Passwords do not match.</p>}
                    </section>
                  )}

                  {signupStep === 2 && (
                    <section className="auth-signup-stage">
                      <h3><strong>Step 2: KYB (Know Your Business)</strong></h3>
                      <label className="auth-input-wrap">
                        <span className="auth-field-label">GSTIN number</span>
                        <input className="input" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase().slice(0, 15))} placeholder="Enter GSTIN if available" maxLength={15} autoCapitalize="characters" disabled={isWorking} />
                      </label>
                      <div className="auth-input-wrap">
                        <label className="auth-field-label" htmlFor="gst-mobile">GST-linked mobile number</label>
                         <div className="auth-verify-row auth-otp-disabled-row">
                          <input id="gst-mobile" className="input" type="tel" inputMode="tel" value={gstRegisteredPhone} onChange={(e) => {
                            setGstRegisteredPhone(e.target.value);
                          }} placeholder="Enter GST-linked mobile number if available" disabled={isWorking} />
                        </div>
                      </div>
                      {gstOtpSent && !gstPhoneVerificationToken && (
                        <div className="auth-verify-row">
                          <input className="input" inputMode="numeric" autoComplete="one-time-code" value={gstPhoneOtp} onChange={(e) => setGstPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="GST-linked mobile OTP" aria-label="GST-linked mobile verification code" />
                          <button className="auth-verify-btn" onClick={() => verifyPhoneOtp("gst-mobile", gstRegisteredPhone, gstPhoneOtp)} type="button" disabled={isWorking}>
                            {otpBusy === "gst-mobile-verify" ? "Verifying..." : "Verify"}
                          </button>
                        </div>
                      )}
                      {gstPhoneVerificationToken && <p className="auth-verified-message">Mobile number verified. GSTIN association will be checked during review.</p>}
                      <p className="auth-review-note">The SMS code verifies access to this mobile number; it does not independently confirm the GSTIN record.</p>
                    </section>
                  )}

                  {signupStep === 3 && (
                    <section className="auth-signup-stage">
                      <h3><strong>Step 3: GI Registry verification</strong></h3>
                      <p className="auth-review-note">Share a supporting GI Registry document for manual verification by TraceConnect.</p>
                      <label className="auth-input-wrap">
                        <span className="auth-field-label">GI Registry document (PDF)</span>
                        <input className="input" type="file" accept="application/pdf,.pdf" onChange={(e) => {
                          const file = e.target.files?.[0];
                          const valid = readSignupFile(e, "application/pdf", setGiRegistryDocument, "GI Registry document");
                          setGiDocumentName(valid ? file?.name || "" : "");
                        }} disabled={isWorking} />
                      </label>
                      {giDocumentName && <p className="auth-verified-message">Selected: {giDocumentName}</p>}
                      <label className="auth-consent-row">
                        <input type="checkbox" checked={giConsent} onChange={(e) => setGiConsent(e.target.checked)} disabled={isWorking} />
                        <span>I authorize TraceConnect to share this document with reviewers for GI Registry verification.</span>
                      </label>
                    </section>
                  )}

                  {fileLoading && <div className="auth-loading-inline"><LoadingIndicator label="Preparing file..." /></div>}
                  {stepLoading && <div className="auth-loading-inline"><LoadingIndicator label="Loading next step..." /></div>}
                  {error && <div className="auth-error">{error}</div>}

                  <div className="auth-step-actions">
                    <button className="btn btn-ghost" disabled={isWorking} onClick={() => goToSignupStep(signupStep - 1)} type="button">Back</button>
                    <button className="auth-submit-btn" disabled={isWorking} type="submit">
                      {isWorking ? <LoadingIndicator label="Please wait..." /> : signupStep === 3 ? "Save profile" : "Next"}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}

          <div className="auth-switch-text">
            {isSignup ? "Already registered? " : "New to TRACECONNECT? "}
            <button type="button" onClick={() => switchMode(isSignup ? "login" : "signup")}>
              {isSignup ? "Login" : "Create an account"}
            </button>
          </div>
          </>}
        </div>
      </div>
    </div>
  );
}
