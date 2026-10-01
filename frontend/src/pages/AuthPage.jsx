import { useEffect, useState } from "react";
import { FiX, FiShield, FiChevronDown } from "react-icons/fi";
import {
  useAuth,
  useRouter,
  delay,
  LoadingIndicator,
  API_URL,
  TRACE_CONNECT_LOGO_SRC,
  INDIA_STATE_DISTRICTS,
  ACCOUNT_TYPE_OPTIONS
} from "./traceconnect";
import "../styles/auth.css";

export default function AuthEntryPage({ toast, modal = false, onClose }) {
  const { login, signup, forgotPassword, setRememberAuth } = useAuth();
  const { navigate } = useRouter();
  const [mode, setMode] = useState("login");
  const [signupStep, setSignupStep] = useState(1);
  const [accountType, setAccountType] = useState("grower");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [villageArea, setVillageArea] = useState("");
  const [district, setDistrict] = useState("");
  const [stateName, setStateName] = useState("");
  const [country, setCountry] = useState("India");
  const [pincode, setPincode] = useState("");
  const [gpsCoordinates, setGpsCoordinates] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [stepLoading, setStepLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [districtFocused, setDistrictFocused] = useState(false);
  const [addressFocused, setAddressFocused] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);

  const isSignup = mode === "signup";
  const stateOptions = Object.keys(INDIA_STATE_DISTRICTS);
  const districtOptions = stateName ? (INDIA_STATE_DISTRICTS[stateName] || []) : [];
  const districtSearch = district.trim().toLowerCase();
  const districtSuggestions = districtOptions
    .filter((name) => !districtSearch || name.toLowerCase().includes(districtSearch));
  const isWorking = busy || stepLoading;
  const showGpsLocationControls = false;

  useEffect(() => {
    if (!stateName || !district) return undefined;

    const controller = new AbortController();
    const loadMapPlaces = async () => {
      setAddressLoading(true);
      try {
        const query = encodeURIComponent(`${district}, ${stateName}, India`);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=20&countrycodes=in&q=${query}`,
          { signal: controller.signal, headers: { "Accept-Language": "en" } },
        );
        if (!response.ok) throw new Error("Map search failed");
        const results = await response.json();
        const places = results
          .map((result) => String(result.display_name || "").trim())
          .filter(Boolean)
          .filter((place, index, all) => all.indexOf(place) === index);
        setAddressSuggestions(places);
      } catch (err) {
        if (err?.name !== "AbortError") setAddressSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setAddressLoading(false);
      }
    };

    loadMapPlaces();
    return () => controller.abort();
  }, [stateName, district]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setSignupStep(1);
    setError("");
    setStepLoading(false);
  };

  const handleStateChange = (value) => {
    setStateName(value);
    setDistrict("");
    setVillageArea("");
    setAddressSuggestions([]);
    setAddressLoading(false);
    setAddressFocused(false);
  };

  const handleDistrictChange = (value) => {
    setDistrict(value);
    setVillageArea("");
    setAddressSuggestions([]);
    setAddressLoading(false);
    setDistrictFocused(false);
    setAddressFocused(false);
  };

  const handleAddressChange = (value) => {
    setVillageArea(value);
    setAddressFocused(true);
  };

  const filteredAddressSuggestions = addressSuggestions.filter((suggestion) =>
    !villageArea.trim() || suggestion.toLowerCase().includes(villageArea.trim().toLowerCase()),
  );

  const handleAddressSuggestion = (value) => {
    setVillageArea(value);
    setAddressFocused(false);
  };

  const goToSignupStep = (nextStep) => {
    setStepLoading(true);
    window.setTimeout(() => {
      setSignupStep(nextStep);
      setStepLoading(false);
    }, 280);
  };

  const handleProfilePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setProfileImage(String(reader.result || ""));
      window.setTimeout(() => {
        setPhotoLoading(false);
        toast("Profile photo ready", "success");
      }, 350);
    };
    reader.onerror = () => {
      setPhotoLoading(false);
      setError("Unable to read profile photo.");
    };
    reader.readAsDataURL(file);
  };

  const handleCompanyLogo = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setCompanyLogo(String(reader.result || ""));
      window.setTimeout(() => {
        setPhotoLoading(false);
        toast("Company logo ready", "success");
      }, 350);
    };
    reader.onerror = () => {
      setPhotoLoading(false);
      setError("Unable to read company logo.");
    };
    reader.readAsDataURL(file);
  };

  const captureLocation = () => {
    setError("");
    if (!navigator.geolocation) {
      setError("Live location is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lon = position.coords.longitude.toFixed(6);
        setLatitude(lat);
        setLongitude(lon);
        setGpsCoordinates(`${lat}, ${lon}`);
        toast("Live location captured");
      },
      () => setError("Unable to capture live location."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
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
      window.location.hash = authedUser?.role === "supplier" ? "/supplier" : "/grower";
    } catch (err) {
      setError(err?.message || "Authentication failed");
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
          phone,
          email,
          password,
          confirm_password: confirmPassword,
          profile_image: profileImage,
          company_logo: companyLogo || null,
          village_area: villageArea,
          district,
          state: stateName,
          country,
          pincode,
          gps_coordinates: gpsCoordinates,
          latitude,
          longitude,
        }),
        delay(650),
      ]);
      toast("Signed up successfully");
      window.location.hash = authedUser?.role === "supplier" ? "/supplier" : "/grower";
    } catch (err) {
      setError(err?.message || "Signup failed");
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    setBusy(true);
    setError("");
    try {
      await forgotPassword(loginIdentifier);
      toast("Password reset request received");
    } catch (err) {
      setError(err?.message || "Unable to request password reset");
    } finally {
      setBusy(false);
    }
  };

  const submitSignupStep = (event) => {
    event.preventDefault();
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
            <FiX />
          </button>
        )}
        <div className="auth-left-panel">
          <div className="auth-left-brand" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <span className="auth-left-logo">
              <img src={TRACE_CONNECT_LOGO_SRC} alt="TraceConnect Logo" />
            </span>
            <span className="auth-left-brand-text">TRACECONNECT</span>
          </div>
          <div className="auth-illustration">
            <FiShield />
          </div>
          <div className="auth-left-copy">
            <h3>Trace every harvest with confidence.</h3>
            <p>Secure records, verified farm activity, batch history, and supply-chain trails stay connected to your account.</p>
          </div>
          <div className="auth-left-tagline">Secure access for farm records, batches, and verification trails.</div>
        </div>

        <div className="auth-right-panel">
          <h2>{isSignup ? "Create account" : "Welcome back"}</h2>
          <div className="auth-modal-tabs" role="tablist" aria-label="Authentication mode">
            <button className={`auth-modal-tab ${!isSignup ? "active" : ""}`} onClick={() => switchMode("login")} type="button">
              Login
            </button>
            <button className={`auth-modal-tab ${isSignup ? "active" : ""}`} onClick={() => switchMode("signup")} type="button">
              Signup
            </button>
          </div>

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
                Continue with Google
              </a>
            </form>
          ) : (
            <form onSubmit={submitSignupStep}>
              <div className="auth-step-row">
                <span className={signupStep >= 1 ? "active" : ""}>1</span>
                <span className={signupStep >= 2 ? "active" : ""}>2</span>
                <span className={signupStep >= 3 ? "active" : ""}>3</span>
              </div>

              {signupStep === 1 && (
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
                </div>
              )}

              {signupStep === 2 && (
                <>
                  <label className="auth-input-wrap">
                    <span className="auth-field-label">Full name</span>
                    <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter full name" disabled={isWorking} required />
                  </label>
                  <label className="auth-input-wrap">
                    <span className="auth-field-label">Mobile number</span>
                    <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter mobile number" disabled={isWorking} required />
                  </label>
                  <label className="auth-input-wrap">
                    <span className="auth-field-label">Email address</span>
                    <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email address" disabled={isWorking} required />
                  </label>
                  <label className="auth-input-wrap">
                    <span className="auth-field-label">Password</span>
                    <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create password" disabled={isWorking} required />
                  </label>
                  <label className="auth-input-wrap">
                    <span className="auth-field-label">Confirm password</span>
                    <input className="input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" disabled={isWorking} required />
                  </label>
                  <label className="auth-input-wrap">
                    <span className="auth-field-label">Profile photo</span>
                    <input className="input" type="file" accept="image/*" onChange={handleProfilePhoto} disabled={isWorking} required={!profileImage} />
                  </label>
                  {photoLoading && (
                    <div className="auth-loading-inline">
                      <LoadingIndicator label="Preparing photo..." />
                    </div>
                  )}
                  {profileImage && (
                    <div className="auth-photo-preview">
                      <img src={profileImage} alt="Profile preview" />
                    </div>
                  )}
                  <label className="auth-input-wrap">
                    <span className="auth-field-label">Company logo (Optional)</span>
                    <input className="input" type="file" accept="image/*" onChange={handleCompanyLogo} disabled={isWorking} />
                  </label>
                  {companyLogo && (
                    <div className="auth-photo-preview">
                      <img src={companyLogo} alt="Company logo preview" />
                    </div>
                  )}
                </>
              )}

              {signupStep === 3 && (
                <>
                  <label className="auth-input-wrap">
                    <span className="auth-field-label">State</span>
                    <span className="auth-select-wrap">
                      <select className="input" value={stateName} onChange={(e) => handleStateChange(e.target.value)} disabled={isWorking} required>
                        <option value="">Select state</option>
                        {stateOptions.map((stateOption) => (
                          <option key={stateOption} value={stateOption}>{stateOption}</option>
                        ))}
                      </select>
                      <FiChevronDown />
                    </span>
                  </label>
                  <label className="auth-input-wrap">
                    <span className="auth-field-label">District / address search</span>
                    <span className="auth-combobox">
                      <input
                        className="input"
                        value={district}
                        onBlur={() => window.setTimeout(() => setDistrictFocused(false), 120)}
                        onChange={(e) => {
                          setDistrict(e.target.value);
                          setVillageArea("");
                          setDistrictFocused(true);
                        }}
                        onFocus={() => setDistrictFocused(true)}
                        placeholder={stateName ? "Type district name" : "Select state first"}
                        autoComplete="off"
                        disabled={!stateName || isWorking}
                        required
                      />
                      {stateName && districtFocused && districtSuggestions.length > 0 && (
                        <div className="auth-suggestion-menu">
                          {districtSuggestions.map((districtName) => (
                            <button
                              key={districtName}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleDistrictChange(districtName)}
                              type="button"
                            >
                              {districtName}
                            </button>
                          ))}
                        </div>
                      )}
                    </span>
                  </label>
                  <label className="auth-input-wrap">
                    <span className="auth-field-label">Address / village area</span>
                    <span className="auth-combobox">
                      <input
                        className="input"
                        value={villageArea}
                        onBlur={() => window.setTimeout(() => setAddressFocused(false), 120)}
                        onChange={(e) => handleAddressChange(e.target.value)}
                        onFocus={() => setAddressFocused(true)}
                        placeholder={district ? "Type address, village, or area" : "Select district first"}
                        autoComplete="off"
                        disabled={!district || isWorking}
                        required
                      />
                      {district && addressFocused && (addressLoading || filteredAddressSuggestions.length > 0) && (
                        <div className="auth-suggestion-menu auth-address-suggestion-menu">
                          {addressLoading && <div className="auth-suggestion-status">Searching map locations...</div>}
                          {!addressLoading && filteredAddressSuggestions.map((suggestion) => (
                            <button
                              key={suggestion}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleAddressSuggestion(suggestion)}
                              type="button"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </span>
                  </label>
                  <label className="auth-input-wrap">
                    <span className="auth-field-label">Country</span>
                    <input className="input" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Enter country" disabled={isWorking} required />
                  </label>
                  <label className="auth-input-wrap">
                    <span className="auth-field-label">Pincode</span>
                    <input className="input" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="Enter pincode (optional)" disabled={isWorking} />
                  </label>
                  {showGpsLocationControls && (
                    <>
                      <label className="auth-input-wrap">
                        <span className="auth-field-label">GPS coordinates</span>
                        <input className="input" value={gpsCoordinates} onChange={(e) => setGpsCoordinates(e.target.value)} placeholder="Latitude, longitude" disabled={isWorking} />
                      </label>
                      <button className="auth-social-btn" onClick={captureLocation} disabled={isWorking} type="button">
                        Capture live location
                      </button>
                    </>
                  )}
                </>
              )}

              {stepLoading && (
                <div className="auth-loading-inline">
                  <LoadingIndicator label="Loading next step..." />
                </div>
              )}

              {error && <div className="auth-error">{error}</div>}

              <div className="auth-step-actions">
                {signupStep > 1 && (
                  <button className="btn btn-ghost" disabled={isWorking} onClick={() => goToSignupStep(signupStep - 1)} type="button">
                    Back
                  </button>
                )}
                <button className="auth-submit-btn" disabled={isWorking} type="submit">
                  {isWorking ? <LoadingIndicator label="Please wait..." /> : signupStep === 3 ? "Create account" : "Continue"}
                </button>
              </div>
            </form>
          )}

          <div className="auth-switch-text">
            {isSignup ? "Already registered? " : "New to TRACECONNECT? "}
            <button type="button" onClick={() => switchMode(isSignup ? "login" : "signup")}>
              {isSignup ? "Login" : "Create an account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
