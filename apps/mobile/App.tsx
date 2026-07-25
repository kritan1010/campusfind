import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { supabase } from "./src/lib/supabase";

type Listing = { id: string; title: string; description: string | null; kind: "lost" | "found"; status: string; created_at: string };
type Tab = "feed" | "matches" | "inbox" | "profile";

export default function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("feed");

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user.id ?? null));
    return () => subscription.subscription.unsubscribe();
  }, []);

  if (!userId) return <AuthScreen />;
  return <MainApp tab={tab} setTab={setTab} userId={userId} />;
}

function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    setBusy(true);
    if (password) {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setBusy(false);
      if (error) Alert.alert("Could not sign in", error.message);
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true, emailRedirectTo: "campusfind://login/verify" } });
    setBusy(false);
    if (error) return Alert.alert("Could not send code", error.message);
    setSent(true);
  }
  async function verify() {
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: "email" });
    setBusy(false);
    if (error) Alert.alert("Could not sign in", error.message);
  }

  return <SafeAreaView style={styles.screen}><View style={styles.auth}>
    <Text style={styles.brand}>CampusFind</Text><Text style={styles.subtitle}>Lost and found, for your campus.</Text>
    <TextInput style={styles.input} autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="you@example.edu" value={email} onChangeText={setEmail} />
    {!sent && <TextInput style={styles.input} secureTextEntry autoComplete="current-password" placeholder="Password (demo/admin only)" value={password} onChangeText={setPassword} />}
    {sent && <TextInput style={styles.input} keyboardType="number-pad" maxLength={6} placeholder="Six-digit code" value={token} onChangeText={setToken} />}
    <Pressable style={styles.primary} onPress={sent ? verify : sendCode} disabled={busy}><Text style={styles.primaryText}>{busy ? "Please wait…" : sent ? "Verify code" : password ? "Sign in with password" : "Email me a code"}</Text></Pressable>
    <Text style={styles.help}>If you receive a link instead, open it on this device. Production email must use the code template in docs/AUTH_AND_DEMO_SETUP.md.</Text>
  </View><StatusBar style="dark" /></SafeAreaView>;
}

function MainApp({ tab, setTab, userId }: { tab: Tab; setTab: (tab: Tab) => void; userId: string }) {
  return <SafeAreaView style={styles.screen}><View style={styles.content}>
    {tab === "feed" && <Feed />}
    {tab === "matches" && <Matches />}
    {tab === "inbox" && <Inbox />}
    {tab === "profile" && <Profile userId={userId} />}
  </View><View style={styles.nav}>{(["feed", "matches", "inbox", "profile"] as Tab[]).map((item) => <Pressable key={item} onPress={() => setTab(item)} style={styles.navItem}><Text style={tab === item ? styles.navActive : styles.navText}>{item[0].toUpperCase() + item.slice(1)}</Text></Pressable>)}</View></SafeAreaView>;
}

function Feed() {
  const [listings, setListings] = useState<Listing[]>([]); const [loading, setLoading] = useState(true);
  async function load() { setLoading(true); const { data, error } = await supabase.from("listings_public").select("id,title,description,kind,status,created_at").in("status", ["open", "claimed", "return_pending"]).order("created_at", { ascending: false }).limit(50); setLoading(false); if (error) Alert.alert("Could not load listings", error.message); else setListings((data ?? []) as Listing[]); }
  useEffect(() => { void load(); }, []);
  return <><Text style={styles.heading}>Nearby listings</Text><Text style={styles.subtitle}>Current lost and found posts</Text>{loading ? <ActivityIndicator /> : <FlatList data={listings} refreshing={loading} onRefresh={load} keyExtractor={(item) => item.id} ListEmptyComponent={<Text style={styles.help}>No open listings yet.</Text>} renderItem={({ item }) => <View style={styles.card}><Text style={item.kind === "lost" ? styles.lost : styles.found}>{item.kind.toUpperCase()}</Text><Text style={styles.cardTitle}>{item.title}</Text>{item.description && <Text>{item.description}</Text>}<Text style={styles.muted}>{item.status}</Text></View>} />}</>;
}

function Matches() { return <View><Text style={styles.heading}>Matches</Text><Text style={styles.help}>Potential matches and claim actions are available on the web during this first mobile release.</Text></View>; }
function Inbox() { return <View><Text style={styles.heading}>Inbox</Text><Text style={styles.help}>Your secure conversations will appear here. Use the web app to start a conversation today.</Text></View>; }
function Profile({ userId }: { userId: string }) { return <View><Text style={styles.heading}>Profile</Text><Text style={styles.help}>Signed in as {userId.slice(0, 8)}…</Text><Pressable style={styles.primary} onPress={() => void supabase.auth.signOut()}><Text style={styles.primaryText}>Sign out</Text></Pressable></View>; }

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: "#fffdf7" }, auth: { flex: 1, justifyContent: "center", padding: 28 }, content: { flex: 1, padding: 20 }, brand: { fontSize: 34, fontWeight: "800", color: "#a3372f" }, heading: { fontSize: 28, fontWeight: "800", color: "#241d14", marginBottom: 6 }, subtitle: { color: "#695f54", marginBottom: 20 }, input: { borderWidth: 1, borderColor: "#d8c68f", backgroundColor: "white", borderRadius: 10, padding: 14, marginBottom: 12 }, primary: { backgroundColor: "#a3372f", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 4 }, primaryText: { color: "white", fontWeight: "700" }, help: { color: "#695f54", lineHeight: 20, marginTop: 16 }, card: { backgroundColor: "white", borderWidth: 1, borderColor: "#eee3c8", padding: 15, borderRadius: 12, marginBottom: 10 }, cardTitle: { fontSize: 17, fontWeight: "700", marginVertical: 4 }, lost: { color: "#a3372f", fontSize: 12, fontWeight: "800" }, found: { color: "#266b54", fontSize: 12, fontWeight: "800" }, muted: { color: "#695f54", fontSize: 12, marginTop: 8 }, nav: { flexDirection: "row", borderTopWidth: 1, borderColor: "#eee3c8", backgroundColor: "white" }, navItem: { flex: 1, paddingVertical: 16, alignItems: "center" }, navText: { color: "#695f54", fontSize: 12 }, navActive: { color: "#a3372f", fontSize: 12, fontWeight: "800" } });
