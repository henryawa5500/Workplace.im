import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const Stack = createNativeStackNavigator();

// Embedded workplace_word_bank_v2 data.
const WORD_BANK = {
  theme: "Workplace/Office Edition",
  format: "clusters",
  notes:
    "Single concrete words only. Each cluster groups words of the same TYPE (roles, objects, tech, etc.) so the imposter's decoy word is genuinely plausible to bluff with.",
  sub_themes: [
    {
      sub_theme: "Job Roles",
      clusters: [
        ["Manager", "Supervisor", "Executive", "Boss"],
        ["Intern", "Trainee", "Assistant", "Apprentice"],
        ["Receptionist", "Secretary", "Clerk", "Coordinator"],
        ["Freelancer", "Consultant", "Contractor", "Vendor"],
        ["Recruiter", "Interviewer", "Applicant", "Candidate"],
      ],
    },
    {
      sub_theme: "Office Objects",
      clusters: [
        ["Stapler", "Tape", "Paperclip", "Scissors"],
        ["Chair", "Desk", "Cubicle", "Cabinet"],
        ["Whiteboard", "Marker", "Notepad", "Calendar"],
        ["Badge", "Lanyard", "Keycard", "Nameplate"],
        ["Monitor", "Keyboard", "Mouse", "Headset"],
      ],
    },
    {
      sub_theme: "Break Room",
      clusters: [
        ["Coffee", "Tea", "Water", "Juice"],
        ["Microwave", "Fridge", "Kettle", "Toaster"],
        ["Snacks", "Chips", "Cookies", "Donuts"],
        ["Vending Machine", "Cafeteria", "Pantry", "Cooler"],
      ],
    },
    {
      sub_theme: "Documents & Paperwork",
      clusters: [
        ["Contract", "Invoice", "Report", "Memo"],
        ["Resume", "Cover Letter", "Reference", "Portfolio"],
        ["Spreadsheet", "Presentation", "Document", "Template"],
        ["Payslip", "Timesheet", "Receipt", "Form"],
      ],
    },
    {
      sub_theme: "Tech & Devices",
      clusters: [
        ["Laptop", "Printer", "Scanner", "Projector"],
        ["Password", "Login", "Username", "Firewall"],
        ["WiFi", "Router", "Server", "Network"],
        ["Email", "Inbox", "Attachment", "Signature"],
      ],
    },
    {
      sub_theme: "Time & Schedule",
      clusters: [
        ["Deadline", "Overtime", "Shift", "Schedule"],
        ["Vacation", "Holiday", "Leave", "Break"],
        ["Meeting", "Appointment", "Interview", "Call"],
        ["Punctual", "Late", "Absent", "Early"],
      ],
    },
    {
      sub_theme: "Money & Career",
      clusters: [
        ["Salary", "Bonus", "Raise", "Commission"],
        ["Promotion", "Demotion", "Transfer", "Resignation"],
        ["Budget", "Expense", "Profit", "Revenue"],
        ["Pension", "Benefits", "Insurance", "Payroll"],
      ],
    },
    {
      sub_theme: "Office Spaces",
      clusters: [
        ["Office", "Lobby", "Elevator", "Hallway"],
        ["Boardroom", "Conference Room", "Lounge", "Reception"],
        ["Parking Lot", "Rooftop", "Stairwell", "Warehouse"],
      ],
    },
    {
      sub_theme: "Communication",
      clusters: [
        ["Bulletin", "Announcement", "Notice", "Update"],
        ["Feedback", "Complaint", "Suggestion", "Review"],
        ["Rumor", "Gossip", "Secret", "Leak"],
      ],
    },
  ],
};

const PLAYABLE_CLUSTERS = WORD_BANK.sub_themes.flatMap((subTheme) =>
  subTheme.clusters.map((words, index) => ({
    subTheme: subTheme.sub_theme,
    cluster: `${subTheme.sub_theme} ${index + 1}`,
    words,
  }))
);

const DEFAULT_NAMES = ["Alex", "Bailey", "Casey", "Devon", "Emery", "Frankie", "Gray", "Harper"];
const TIMER_OPTIONS = [
  { label: "1 min", seconds: 60 },
  { label: "2 min", seconds: 120 },
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
];

function sample(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function sampleTwoDifferent(items) {
  const firstIndex = Math.floor(Math.random() * items.length);
  let secondIndex = Math.floor(Math.random() * items.length);

  while (secondIndex === firstIndex) {
    secondIndex = Math.floor(Math.random() * items.length);
  }

  return [items[firstIndex], items[secondIndex]];
}

function createRound(playerNames) {
  const cluster = sample(PLAYABLE_CLUSTERS);
  const [realWord, decoyWord] = sampleTwoDifferent(cluster.words);
  const imposterIndex = Math.floor(Math.random() * playerNames.length);

  return {
    id: `${Date.now()}-${Math.random()}`,
    players: playerNames,
    cluster: cluster.cluster,
    realWord,
    decoyWord,
    imposterIndex,
    imposterName: playerNames[imposterIndex],
    assignments: playerNames.map((name, index) => ({
      name,
      word: index === imposterIndex ? decoyWord : realWord,
      isImposter: index === imposterIndex,
    })),
  };
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getResolution(round, votes) {
  const counts = {};

  round.players.forEach((name) => {
    counts[name] = 0;
  });

  Object.values(votes).forEach((votedFor) => {
    if (counts[votedFor] !== undefined) {
      counts[votedFor] += 1;
    }
  });

  const maxVotes = Math.max(...Object.values(counts));
  const topNames = Object.keys(counts).filter((name) => counts[name] === maxVotes);
  const tied = topNames.length > 1;
  const accused = tied ? topNames.join(", ") : topNames[0];
  const caught = !tied && accused === round.imposterName;

  return { counts, maxVotes, topNames, tied, accused, caught };
}

function Screen({ children }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {children}
    </SafeAreaView>
  );
}

function PrimaryButton({ title, onPress, disabled }) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled}
      onPress={onPress}
      style={[styles.primaryButton, disabled && styles.disabledButton]}
    >
      <Text style={styles.primaryButtonText}>{title}</Text>
    </TouchableOpacity>
  );
}

// 1. Setup Screen
function SetupScreen({ onStartGame, initialPlayers, initialTimerSeconds }) {
  const [playerCount, setPlayerCount] = useState(initialPlayers.length);
  const [names, setNames] = useState(() => DEFAULT_NAMES.slice(0, initialPlayers.length));
  const [timerSeconds, setTimerSeconds] = useState(initialTimerSeconds);

  function updatePlayerCount(nextCount) {
    const clamped = Math.max(3, Math.min(8, nextCount));
    setPlayerCount(clamped);
    setNames((currentNames) =>
      Array.from({ length: clamped }, (_, index) => currentNames[index] || DEFAULT_NAMES[index] || `Player ${index + 1}`)
    );
  }

  function updateName(index, value) {
    setNames((currentNames) => {
      const nextNames = [...currentNames];
      nextNames[index] = value;
      return nextNames;
    });
  }

  function startGame() {
    const cleanNames = names
      .slice(0, playerCount)
      .map((name, index) => name.trim() || `Player ${index + 1}`);
    const normalized = cleanNames.map((name) => name.toLowerCase());
    const uniqueCount = new Set(normalized).size;

    if (uniqueCount !== cleanNames.length) {
      Alert.alert("Use unique names", "Duplicate names make private voting hard to tally.");
      return;
    }

    onStartGame(cleanNames, timerSeconds);
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.titleBlock}>
            <Text style={styles.kicker}>Local party prototype</Text>
            <Text style={styles.title}>Workplace Imposter</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Players</Text>
            <View style={styles.countRow}>
              <TouchableOpacity style={styles.stepButton} onPress={() => updatePlayerCount(playerCount - 1)}>
                <Text style={styles.stepButtonText}>-</Text>
              </TouchableOpacity>
              <TextInput
                editable={false}
                keyboardType="number-pad"
                value={String(playerCount)}
                style={styles.countInput}
              />
              <TouchableOpacity style={styles.stepButton} onPress={() => updatePlayerCount(playerCount + 1)}>
                <Text style={styles.stepButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            {Array.from({ length: playerCount }, (_, index) => (
              <TextInput
                key={index}
                autoCapitalize="words"
                onChangeText={(value) => updateName(index, value)}
                placeholder={`Player ${index + 1}`}
                style={styles.input}
                value={names[index] || ""}
              />
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Discussion timer</Text>
            <View style={styles.optionGrid}>
              {TIMER_OPTIONS.map((option) => {
                const selected = timerSeconds === option.seconds;
                return (
                  <TouchableOpacity
                    key={option.seconds}
                    onPress={() => setTimerSeconds(option.seconds)}
                    style={[styles.optionButton, selected && styles.optionButtonSelected]}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <PrimaryButton title="Start Game" onPress={startGame} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

// 3. Pass-and-Play Reveal Screen
function RevealScreen({ round, onFinishedReveal }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const currentAssignment = round.assignments[currentIndex];
  const isLastPlayer = currentIndex === round.assignments.length - 1;

  function hideAndPass() {
    if (isLastPlayer) {
      onFinishedReveal();
      return;
    }

    setIsRevealed(false);
    setCurrentIndex((index) => index + 1);
  }

  return (
    <Screen>
      <View style={styles.centerContent}>
        <Text style={styles.progressText}>
          Player {currentIndex + 1} of {round.assignments.length}
        </Text>

        {!isRevealed ? (
          <>
            <Text style={styles.passTitle}>Pass the phone to</Text>
            <Text style={styles.playerName}>{currentAssignment.name}</Text>
            <PrimaryButton title="Reveal My Word" onPress={() => setIsRevealed(true)} />
          </>
        ) : (
          <>
            {currentAssignment.isImposter ? (
              <View style={styles.wordCard}>
                <Text style={styles.imposterRoleText}>You are the Imposter</Text>
                <Text style={styles.hintLabel}>Your hint word:</Text>
                <Text style={styles.wordText}>{currentAssignment.word}</Text>
              </View>
            ) : (
              <View style={styles.wordCard}>
                <Text style={styles.wordText}>{currentAssignment.word}</Text>
              </View>
            )}
            <PrimaryButton title={isLastPlayer ? "Hide & Start Discussion" : "Hide & Pass to Next"} onPress={hideAndPass} />
          </>
        )}
      </View>
    </Screen>
  );
}

// 4. Discussion Timer Screen
function DiscussionScreen({ timerSeconds, onTimerDone }) {
  const [secondsLeft, setSecondsLeft] = useState(timerSeconds);

  useEffect(() => {
    setSecondsLeft(timerSeconds);
  }, [timerSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      const doneTimer = setTimeout(onTimerDone, 250);
      return () => clearTimeout(doneTimer);
    }

    const tick = setTimeout(() => {
      setSecondsLeft((currentSeconds) => currentSeconds - 1);
    }, 1000);

    return () => clearTimeout(tick);
  }, [onTimerDone, secondsLeft]);

  return (
    <Screen>
      <View style={styles.centerContent}>
        <Text style={styles.kicker}>Discussion</Text>
        <Text style={styles.timerText}>{formatTime(secondsLeft)}</Text>
        <Text style={styles.helperText}>Talk it out, compare clues, and find the odd word.</Text>
        <View style={styles.secondaryButtonWrap}>
          <Button title="Skip Timer" onPress={onTimerDone} />
        </View>
      </View>
    </Screen>
  );
}

// 5. Pass-and-Play Voting Screen
function VotingScreen({ round, onFinishedVoting }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVoting, setIsVoting] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [localVotes, setLocalVotes] = useState({});
  const currentPlayer = round.players[currentIndex];
  const choices = round.players.filter((name) => name !== currentPlayer);
  const isLastPlayer = currentIndex === round.players.length - 1;

  function submitVote() {
    if (!selectedName) {
      return;
    }

    const nextVotes = { ...localVotes, [currentPlayer]: selectedName };

    if (isLastPlayer) {
      onFinishedVoting(nextVotes);
      return;
    }

    setLocalVotes(nextVotes);
    setCurrentIndex((index) => index + 1);
    setSelectedName("");
    setIsVoting(false);
  }

  return (
    <Screen>
      <View style={styles.centerContent}>
        <Text style={styles.progressText}>
          Vote {currentIndex + 1} of {round.players.length}
        </Text>

        {!isVoting ? (
          <>
            <Text style={styles.passTitle}>Pass the phone to</Text>
            <Text style={styles.playerName}>{currentPlayer}</Text>
            <PrimaryButton title="Vote Privately" onPress={() => setIsVoting(true)} />
          </>
        ) : (
          <View style={styles.votePanel}>
            <Text style={styles.sectionTitle}>Who is the Imposter?</Text>
            {choices.map((name) => {
              const selected = selectedName === name;
              return (
                <TouchableOpacity
                  key={name}
                  onPress={() => setSelectedName(name)}
                  style={[styles.voteOption, selected && styles.voteOptionSelected]}
                >
                  <Text style={[styles.voteOptionText, selected && styles.voteOptionTextSelected]}>{name}</Text>
                </TouchableOpacity>
              );
            })}
            <PrimaryButton title="Submit Vote" disabled={!selectedName} onPress={submitVote} />
          </View>
        )}
      </View>
    </Screen>
  );
}

// 7. Reveal / Resolution Screen
function ResultsScreen({ round, votes, onPlayAgain }) {
  const resolution = useMemo(() => getResolution(round, votes), [round, votes]);
  const sortedCounts = Object.entries(resolution.counts).sort((a, b) => b[1] - a[1]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.titleBlock}>
          <Text style={styles.kicker}>Round result</Text>
          <Text style={styles.title}>{resolution.caught ? "Imposter caught" : "Imposter escaped"}</Text>
        </View>

        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>Actual Imposter</Text>
          <Text style={styles.resultValue}>{round.imposterName}</Text>
        </View>

        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>Real Word</Text>
          <Text style={styles.resultValue}>{round.realWord}</Text>
        </View>

        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>{resolution.tied ? "Vote Tie" : "Accused Player"}</Text>
          <Text style={styles.resultValue}>{resolution.accused}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vote tally</Text>
          {sortedCounts.map(([name, count]) => (
            <View key={name} style={styles.tallyRow}>
              <Text style={styles.tallyName}>{name}</Text>
              <Text style={styles.tallyCount}>
                {count} vote{count === 1 ? "" : "s"}
              </Text>
            </View>
          ))}
        </View>

        <PrimaryButton title="Play Again" onPress={onPlayAgain} />
      </ScrollView>
    </Screen>
  );
}

function MissingRoundScreen({ onBackToSetup }) {
  return (
    <Screen>
      <View style={styles.centerContent}>
        <Text style={styles.title}>No active round</Text>
        <PrimaryButton title="Back to Setup" onPress={onBackToSetup} />
      </View>
    </Screen>
  );
}

export default function App() {
  const [players, setPlayers] = useState(DEFAULT_NAMES.slice(0, 3));
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [round, setRound] = useState(null);
  const [votes, setVotes] = useState({});

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Setup">
            {(props) => (
              <SetupScreen
                {...props}
                initialPlayers={players}
                initialTimerSeconds={timerSeconds}
                onStartGame={(nextPlayers, nextTimerSeconds) => {
                  setPlayers(nextPlayers);
                  setTimerSeconds(nextTimerSeconds);
                  setVotes({});
                  setRound(createRound(nextPlayers));
                  props.navigation.replace("Reveal");
                }}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="Reveal">
            {(props) =>
              round ? (
                <RevealScreen round={round} onFinishedReveal={() => props.navigation.replace("Discussion")} />
              ) : (
                <MissingRoundScreen onBackToSetup={() => props.navigation.replace("Setup")} />
              )
            }
          </Stack.Screen>

          <Stack.Screen name="Discussion">
            {(props) =>
              round ? (
                <DiscussionScreen timerSeconds={timerSeconds} onTimerDone={() => props.navigation.replace("Voting")} />
              ) : (
                <MissingRoundScreen onBackToSetup={() => props.navigation.replace("Setup")} />
              )
            }
          </Stack.Screen>

          <Stack.Screen name="Voting">
            {(props) =>
              round ? (
                <VotingScreen
                  round={round}
                  onFinishedVoting={(finalVotes) => {
                    setVotes(finalVotes);
                    props.navigation.replace("Results");
                  }}
                />
              ) : (
                <MissingRoundScreen onBackToSetup={() => props.navigation.replace("Setup")} />
              )
            }
          </Stack.Screen>

          <Stack.Screen name="Results">
            {(props) =>
              round ? (
                <ResultsScreen
                  round={round}
                  votes={votes}
                  onPlayAgain={() => {
                    setVotes({});
                    setRound(createRound(players));
                    props.navigation.replace("Reveal");
                  }}
                />
              ) : (
                <MissingRoundScreen onBackToSetup={() => props.navigation.replace("Setup")} />
              )
            }
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f4ee",
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    gap: 18,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    padding: 22,
    gap: 18,
  },
  titleBlock: {
    marginBottom: 4,
  },
  kicker: {
    color: "#2f6f73",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    color: "#1f2933",
    fontSize: 34,
    fontWeight: "800",
    marginTop: 4,
  },
  section: {
    backgroundColor: "#ffffff",
    borderColor: "#ddd6c8",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  sectionTitle: {
    color: "#1f2933",
    fontSize: 18,
    fontWeight: "800",
  },
  countRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  stepButton: {
    alignItems: "center",
    backgroundColor: "#294c60",
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    width: 54,
  },
  stepButtonText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
  },
  countInput: {
    backgroundColor: "#f7f4ee",
    borderColor: "#c9c0b0",
    borderRadius: 8,
    borderWidth: 1,
    color: "#1f2933",
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    height: 44,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#f7f4ee",
    borderColor: "#c9c0b0",
    borderRadius: 8,
    borderWidth: 1,
    color: "#1f2933",
    fontSize: 18,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionButton: {
    backgroundColor: "#f7f4ee",
    borderColor: "#c9c0b0",
    borderRadius: 8,
    borderWidth: 1,
    minWidth: "47%",
    paddingVertical: 12,
  },
  optionButtonSelected: {
    backgroundColor: "#2f6f73",
    borderColor: "#2f6f73",
  },
  optionText: {
    color: "#1f2933",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  optionTextSelected: {
    color: "#ffffff",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#c9514a",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  disabledButton: {
    backgroundColor: "#9da3a8",
  },
  progressText: {
    color: "#5f6b75",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  passTitle: {
    color: "#1f2933",
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
  },
  playerName: {
    color: "#c9514a",
    fontSize: 40,
    fontWeight: "900",
    textAlign: "center",
  },
  wordCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#2f6f73",
    borderRadius: 8,
    borderWidth: 2,
    minHeight: 150,
    justifyContent: "center",
    padding: 18,
  },
  wordText: {
    color: "#1f2933",
    fontSize: 42,
    fontWeight: "900",
    textAlign: "center",
  },
  imposterRoleText: {
    color: "#c9514a",
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 18,
    textAlign: "center",
  },
  hintLabel: {
    color: "#5f6b75",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
    textAlign: "center",
  },
  timerText: {
    color: "#1f2933",
    fontSize: 86,
    fontWeight: "900",
    textAlign: "center",
  },
  helperText: {
    color: "#5f6b75",
    fontSize: 18,
    lineHeight: 26,
    textAlign: "center",
  },
  secondaryButtonWrap: {
    marginTop: 8,
  },
  votePanel: {
    gap: 12,
  },
  voteOption: {
    backgroundColor: "#ffffff",
    borderColor: "#c9c0b0",
    borderRadius: 8,
    borderWidth: 1,
    padding: 15,
  },
  voteOptionSelected: {
    backgroundColor: "#294c60",
    borderColor: "#294c60",
  },
  voteOptionText: {
    color: "#1f2933",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  voteOptionTextSelected: {
    color: "#ffffff",
  },
  resultBox: {
    backgroundColor: "#ffffff",
    borderColor: "#ddd6c8",
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  resultLabel: {
    color: "#5f6b75",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  resultValue: {
    color: "#1f2933",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 5,
  },
  tallyRow: {
    alignItems: "center",
    borderBottomColor: "#ece6da",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  tallyName: {
    color: "#1f2933",
    fontSize: 17,
    fontWeight: "700",
  },
  tallyCount: {
    color: "#2f6f73",
    fontSize: 16,
    fontWeight: "800",
  },
});
