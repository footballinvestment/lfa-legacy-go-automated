// TEST MUI AUTOCOMPLETE - Suspected cause of React Error #130 from SearchFilters
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline, Grid, Paper, Autocomplete, TextField, Chip } from "@mui/material";
import { lightAppTheme } from "./styles/theme";
import { SafeAuthProvider, useSafeAuth, ProtectedRoute, PublicRoute } from "./SafeAuthContext";

// Mock data similar to SearchFilters
const mockOptions = [
  { label: 'Premier League', value: 'premier_league' },
  { label: 'La Liga', value: 'la_liga' },
  { label: 'Bundesliga', value: 'bundesliga' },
  { label: 'Serie A', value: 'serie_a' },
  { label: 'Ligue 1', value: 'ligue_1' }
];

const mockTeamOptions = [
  { label: 'Manchester United', value: 'man_utd' },
  { label: 'Real Madrid', value: 'real_madrid' },
  { label: 'Bayern Munich', value: 'bayern' },
  { label: 'Juventus', value: 'juventus' },
  { label: 'PSG', value: 'psg' }
];

// Test Autocomplete Component (from SearchFilters.tsx patterns)
const AutocompleteTest: React.FC = () => {
  const [selectedLeagues, setSelectedLeagues] = useState<any[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<any[]>([]);
  const [singleValue, setSingleValue] = useState<any>(null);

  return (
    <div style={{ padding: "20px", background: "linear-gradient(135deg, #0f172a, #1e293b)", minHeight: "100vh", color: "white" }}>
      <h1 style={{color: "#10b981"}}>🔍 MUI AUTOCOMPLETE TEST</h1>
      <p style={{color: "#cbd5e1", marginBottom: "30px"}}>
        Testing Autocomplete components similar to SearchFilters.tsx patterns
      </p>
      
      <Grid container spacing={3}>
        {/* Test 1: Multiple Autocomplete with renderTags */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper style={{ padding: "15px", background: "#334155" }}>
            <h3 style={{color: "#10b981", marginBottom: "15px"}}>Test 1: Multiple with Chips</h3>
            <Autocomplete
              multiple
              options={mockOptions}
              getOptionLabel={(option) => option.label}
              value={selectedLeagues}
              onChange={(event, newValue) => setSelectedLeagues(newValue)}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    {...getTagProps({ index })}
                    size="small"
                    style={{ 
                      backgroundColor: "#10b981", 
                      color: "white",
                      margin: "2px"
                    }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Leagues"
                  variant="outlined"
                  fullWidth
                  style={{ backgroundColor: "#475569" }}
                  InputLabelProps={{ style: { color: "#cbd5e1" } }}
                  InputProps={{
                    ...params.InputProps,
                    style: { color: "white" }
                  }}
                />
              )}
              style={{ backgroundColor: "#475569", borderRadius: "4px" }}
            />
          </Paper>
        </Grid>

        {/* Test 2: Single Select Autocomplete */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper style={{ padding: "15px", background: "#334155" }}>
            <h3 style={{color: "#10b981", marginBottom: "15px"}}>Test 2: Single Select</h3>
            <Autocomplete
              options={mockTeamOptions}
              getOptionLabel={(option) => option.label}
              value={singleValue}
              onChange={(event, newValue) => setSingleValue(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Team"
                  variant="outlined"
                  fullWidth
                  style={{ backgroundColor: "#475569" }}
                  InputLabelProps={{ style: { color: "#cbd5e1" } }}
                  InputProps={{
                    ...params.InputProps,
                    style: { color: "white" }
                  }}
                />
              )}
              style={{ backgroundColor: "#475569", borderRadius: "4px" }}
            />
          </Paper>
        </Grid>

        {/* Test 3: Complex Autocomplete with Custom Rendering */}
        <Grid size={{ xs: 12 }}>
          <Paper style={{ padding: "15px", background: "#334155" }}>
            <h3 style={{color: "#10b981", marginBottom: "15px"}}>Test 3: Multiple with Custom Options</h3>
            <Autocomplete
              multiple
              options={mockTeamOptions}
              getOptionLabel={(option) => option.label}
              value={selectedTeams}
              onChange={(event, newValue) => setSelectedTeams(newValue)}
              renderOption={(props, option) => (
                <li {...props} style={{ padding: "8px", color: "#1f2937" }}>
                  <div>
                    <div style={{ fontWeight: "bold" }}>{option.label}</div>
                    <div style={{ fontSize: "0.8em", color: "#6b7280" }}>{option.value}</div>
                  </div>
                </li>
              )}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    {...getTagProps({ index })}
                    size="small"
                    variant="filled"
                    style={{ 
                      backgroundColor: "#0c4a6e", 
                      color: "white",
                      margin: "2px"
                    }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Multiple Teams"
                  variant="outlined"
                  fullWidth
                  placeholder="Start typing..."
                  style={{ backgroundColor: "#475569" }}
                  InputLabelProps={{ style: { color: "#cbd5e1" } }}
                  InputProps={{
                    ...params.InputProps,
                    style: { color: "white" }
                  }}
                />
              )}
              style={{ backgroundColor: "#475569", borderRadius: "4px" }}
            />
          </Paper>
        </Grid>

        {/* Results Display */}
        <Grid size={{ xs: 12 }}>
          <Paper style={{ padding: "15px", background: "#065f46" }}>
            <h3 style={{color: "white", marginBottom: "10px"}}>🧪 Test Results</h3>
            <div style={{ color: "white", fontSize: "14px" }}>
              <strong>Selected Leagues:</strong> {selectedLeagues.map(l => l.label).join(', ') || 'None'}<br/>
              <strong>Selected Team:</strong> {singleValue?.label || 'None'}<br/>
              <strong>Multiple Teams:</strong> {selectedTeams.map(t => t.label).join(', ') || 'None'}
            </div>
          </Paper>
        </Grid>
      </Grid>

      <div style={{ marginTop: "30px", padding: "15px", background: "#334155", borderRadius: "8px" }}>
        <h3 style={{color: "#10b981"}}>🔍 Autocomplete Components Status</h3>
        <div style={{ color: "#cbd5e1", fontSize: "14px" }}>
          ✅ ThemeProvider: WORKING<br/>
          ✅ CssBaseline: WORKING<br/>
          ✅ Grid: WORKING<br/>
          ✅ Paper: WORKING<br/>
          🔬 Autocomplete multiple: TESTING<br/>
          🔬 Autocomplete single: TESTING<br/>
          🔬 Autocomplete renderTags: TESTING<br/>
          🔬 Autocomplete renderOption: TESTING<br/>
          🔬 TextField integration: TESTING<br/>
          🔬 Chip components: TESTING
        </div>
      </div>
    </div>
  );
};

const AutocompleteTestLogin: React.FC = () => {
  const { state, login, clearError } = useSafeAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await login({ username, password });
  };

  if (state.isAuthenticated && state.user) {
    return <AutocompleteTest />;
  }

  return (
    <div style={{
      padding: "40px", 
      maxWidth: "400px", 
      margin: "0 auto",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a, #1e293b)"
    }}>
      <h1 style={{ color: "white", textAlign: "center" }}>⚽ LFA Legacy GO</h1>
      <h3 style={{ color: "#10b981", textAlign: "center" }}>🔍 AUTOCOMPLETE TEST</h3>
      
      <form onSubmit={handleSubmit}>
        <div style={{margin: "15px 0"}}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{width: "100%", padding: "10px", fontSize: "16px", borderRadius: "4px", border: "none"}}
            required
          />
        </div>
        <div style={{margin: "15px 0"}}>
          <input
            type="password"
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{width: "100%", padding: "10px", fontSize: "16px", borderRadius: "4px", border: "none"}}
            required
          />
        </div>
        <button
          type="submit"
          disabled={state.loading}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "16px",
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: state.loading ? "wait" : "pointer"
          }}
        >
          {state.loading ? "Logging in..." : "LOGIN"}
        </button>
      </form>

      {state.error && (
        <div style={{marginTop: "15px", color: "#ff6b6b", fontSize: "14px"}}>
          Error: {state.error}
        </div>
      )}

      <div style={{marginTop: "20px", fontSize: "12px", color: "#888"}}>
        🔍 Testing MUI Autocomplete components<br/>
        Login to see complex Autocomplete patterns<br/>
        from SearchFilters.tsx - potential React Error #130 source
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={lightAppTheme}>
      <CssBaseline />
      <SafeAuthProvider>
        <Router>
          <Routes>
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <AutocompleteTestLogin />
                </PublicRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <AutocompleteTestLogin />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </SafeAuthProvider>
    </ThemeProvider>
  );
};

export default App;