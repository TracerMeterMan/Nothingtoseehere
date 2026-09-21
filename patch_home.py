with open('src/screens/HomeScreen.tsx', 'r') as f:
    content = f.read()

# 1. Add muscleGroups import after theme import
old_import = 'import { theme } from "../theme/theme";'
new_import = 'import { theme } from "../theme/theme";\nimport { muscleGroups } from "../data/muscleGroups";'
content = content.replace(old_import, new_import, 1)

# 2. Add showSplitInsights state after isSearchModalVisible
old_state = '  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);\n'
new_state = '  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);\n  const [showSplitInsights, setShowSplitInsights] = useState(false);\n'
content = content.replace(old_state, new_state, 1)

# 3. Update computeSplitMetricsAndFatigue early return to include new fields
old_return = '    if (!activeSplit || !activeSplit.days) return { weeklyVolume: {}, warnings: [] };\n'
new_return = '    if (!activeSplit || !activeSplit.days) return { weeklyVolume: {}, warnings: [], frequencyWarnings: [], splitScore: 100 };\n'
content = content.replace(old_return, new_return, 1)

# 4. Insert MAIN_MUSCLES, init tracking variables
marker = '''    const weeklyVolume: Record<string, number> = {};
    const dailyMuscleSets: Record<number, Record<string, number>> = {};

    for (let i = 0; i < 7; i++) {
      dailyMuscleSets[i] = {};
    }

    activeSplit.days'''
insert = '''    const MAIN_MUSCLES = new Set([
      "chest", "upperBack", "lats",
      "frontDelts", "sideDelts", "rearDelts",
      "biceps", "triceps", "abs",
      "quads", "glutes", "hamstrings"
    ]);

    const weeklyVolume: Record<string, number> = {};
    const dailyMuscleSets: Record<number, Record<string, number>> = {};

    for (let i = 0; i < 7; i++) {
      dailyMuscleSets[i] = {};
    }

    const warnings: string[] = [];
    let fatigueCount = 0;

    activeSplit.days'''
content = content.replace(marker, insert, 1)

# 5. Switch volume multiplier from role-based to load-based
old_loop = '''          exercise.muscles.forEach((m) => {
            const muscleId = m.muscleId;
            const role = (m.type || m.role || "primary").toLowerCase();
            
            let multiplier = 0.0;
            if (role === "primary" || role === "target" || role === "full") {
              multiplier = 1.0;
            } else if (role === "secondary" || role === "synergist") {
              multiplier = 0.5;
            } else if (role === "stabilizer") {
              multiplier = 0.0;
            }

            const calculatedVolume = sets * multiplier;

            if (calculatedVolume > 0) {
              weeklyVolume[muscleId] = (weeklyVolume[muscleId] || 0) + calculatedVolume;
              dailyMuscleSets[dayIndex][muscleId] = (dailyMuscleSets[dayIndex][muscleId] || 0) + calculatedVolume;
            }
          });'''
new_loop = '''          exercise.muscles.forEach((m) => {
            const muscleId = m.muscleId;
            const load = m.load || "low";
            
            let multiplier = 0.0;
            if (load === "high") multiplier = 1.0;
            if (load === "medium") multiplier = 0.5;

            const calculatedVolume = sets * multiplier;

            if (calculatedVolume > 0) {
              weeklyVolume[muscleId] = (weeklyVolume[muscleId] || 0) + calculatedVolume;
              dailyMuscleSets[dayIndex][muscleId] = (dailyMuscleSets[dayIndex][muscleId] || 0) + calculatedVolume;
            }
          });'''
content = content.replace(old_loop, new_loop, 1)

# 6. Add fatigueCount increment inside checkConsecutiveFatigue
old_check = '''      const checkConsecutiveFatigue = (musclesToCheck: string[], label: string, thresholdSets = 3) => {
        musclesToCheck.forEach((muscle) => {
          const todaySets = currentMuscles[muscle] || 0;
          const tomorrowSets = nextMuscles[muscle] || 0;

          if (todaySets >= thresholdSets && tomorrowSets > 0) {
            warnings.push(
              `High fatigue risk for ${label} (${muscle}) between ${currentDayName} and ${nextDayName}. Consecutive day loading detected with ${todaySets.toFixed(1)} sets on ${currentDayName}.`
            );
          }
        });
      };'''
new_check = '''      const checkConsecutiveFatigue = (musclesToCheck: string[], label: string, thresholdSets = 3) => {
        musclesToCheck.forEach((muscle) => {
          const todaySets = currentMuscles[muscle] || 0;
          const tomorrowSets = nextMuscles[muscle] || 0;

          if (todaySets >= thresholdSets && tomorrowSets > 0) {
            warnings.push(
              `High fatigue risk for ${label} (${muscle}) between ${currentDayName} and ${nextDayName}. Consecutive day loading detected with ${todaySets.toFixed(1)} sets on ${currentDayName}.`
            );
            fatigueCount += 1;
          }
        });
      };'''
content = content.replace(old_check, new_check, 1)

# 7. Replace extreme volume warning with: days-trained frequency warnings + fatigue penalty + splitScore
old_warn = '''    Object.entries(weeklyVolume).forEach(([muscle, totalSets]) => {
      if (totalSets > 20) {
        warnings.push(`Extreme volume warning: ${muscle} has ${totalSets.toFixed(1)} sets per week. Consider reducing sets below 20 to prevent overreaching.`);
      }
    });

    return { weeklyVolume, warnings };
  };'''
new_warn = '''    muscleGroups.forEach((m) => {
      const daysTrained = Object.values(dailyMuscleSets).filter((dayMuscles) => (dayMuscles[m.id] || 0) > 0).length;
      if (daysTrained < 2 && MAIN_MUSCLES.has(m.id)) {
        const label = m.name;
        const msg = daysTrained === 0 ? `${label} not trained this split.` : `${label} trained only ${daysTrained} day this split.`;
        frequencyWarnings.push(msg);
        if (daysTrained === 0) score -= 10;
        else score -= 5;
      }
    });

    const fatiguePenalty = Math.min(fatigueCount * 5, 25);
    score = Math.max(0, score - fatiguePenalty);

    return { weeklyVolume, warnings, frequencyWarnings, splitScore: score };
  };'''
content = content.replace(old_warn, new_warn, 1)

# 8. Update destructuring
old_destructure = '  const { weeklyVolume: splitWeeklyVolume, warnings: splitWarnings } = computeSplitMetricsAndFatigue();'
new_destructure = '  const { weeklyVolume: splitWeeklyVolume, warnings: splitWarnings, frequencyWarnings, splitScore } = computeSplitMetricsAndFatigue();'
content = content.replace(old_destructure, new_destructure, 1)

# 9. Restructure split editor metrics component
old_metrics = '''            {/* ========================================== */}
            {/* ADVANCED SPLIT METRICS COMPONENT */}
            {/* ========================================== */}
            <View style={styles.metricsContainer}>
              <View style={styles.insightsToggleRow}>
                <Text style={styles.insightsToggleLabel}>Advanced Insights</Text>
                <Pressable
                  style={[styles.insightsToggleSwitch, showSplitInsights && styles.insightsToggleSwitchActive]}
                  onPress={() => setShowSplitInsights(!showSplitInsights)}
                >
                  <View style={[styles.insightsToggleKnob, { alignSelf: showSplitInsights ? "flex-end" : "flex-start" }]} />
                </Pressable>
              </View>

              <Text style={styles.sectionHeader}>Weekly Muscle Volume (Sets)</Text>'''
new_metrics = '''            <View style={styles.metricsContainer}>
              <View style={styles.insightsToggleRow}>
                <Text style={styles.insightsToggleLabel}>Show More</Text>
                <Pressable
                  style={[styles.insightsToggleSwitch, showSplitInsights && styles.insightsToggleSwitchActive]}
                  onPress={() => setShowSplitInsights(!showSplitInsights)}
                >
                  <View style={[styles.insightsToggleKnob, { alignSelf: showSplitInsights ? "flex-end" : "flex-start" }]} />
                </Pressable>
              </View>

              <Text style={styles.sectionHeader}>Weekly Muscle Volume (Sets)</Text>'''
content = content.replace(old_metrics, new_metrics, 1)

old_footer = '''              <Text style={styles.subHeader}>Fatigue & Recovery Alerts</Text>
              <View style={styles.warningBox}>
                {splitWarnings.length > 0 ? (
                  splitWarnings.map((warn, index) => (
                    <View key={index} style={styles.warningRow}>
                      <Text style={styles.warningBullet}>•</Text>
                      <Text style={styles.warningText}>{warn}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.optimalText}>No recovery bottlenecks found. Your split allocation is recovery-optimal.</Text>
                )}
              </View>

              {showSplitInsights && (
                <>
                  <Text style={styles.subHeader}>Split Score</Text>
                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreLabel}>Overall Balance</Text>
                    <Text style={[styles.scoreValue, { color: splitScore >= 80 ? "#30D158" : splitScore >= 50 ? "#FF9500" : "#FF453A" }]}>
                      {splitScore}/100
                    </Text>
                  </View>

                  <Text style={styles.subHeader}>Frequency Warnings</Text>
                  {frequencyWarnings.length > 0 && (
                    <View style={styles.frequencyBox}>
                      {frequencyWarnings.map((warn, index) => (
                        <View key={index} style={styles.frequencyRow}>
                          <Text style={styles.frequencyBullet}>•</Text>
                          <Text style={styles.frequencyText}>{warn}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>'''
new_footer = '''              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Overall Balance</Text>
                <Text style={[styles.scoreValue, { color: splitScore >= 80 ? "#30D158" : splitScore >= 50 ? "#FF9500" : "#FF453A" }]}>
                  {splitScore}/100
                </Text>
              </View>

              {showSplitInsights && (
                <>
                  <Text style={styles.subHeader}>Fatigue & Recovery Alerts</Text>
                  <View style={styles.warningBox}>
                    {splitWarnings.length > 0 ? (
                      splitWarnings.map((warn, index) => (
                        <View key={index} style={styles.warningRow}>
                          <Text style={styles.warningBullet}>•</Text>
                          <Text style={styles.warningText}>{warn}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.optimalText}>No recovery bottlenecks found. Your split allocation is recovery-optimal.</Text>
                    )}
                  </View>

                  <Text style={styles.subHeader}>Frequency Warnings</Text>
                  {frequencyWarnings.length > 0 && (
                    <View style={styles.frequencyBox}>
                      {frequencyWarnings.map((warn, index) => (
                        <View key={index} style={styles.frequencyRow}>
                          <Text style={styles.frequencyBullet}>•</Text>
                          <Text style={styles.frequencyText}>{warn}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>'''
content = content.replace(old_footer, new_footer, 1)

# Remove duplicate safe guards
if 'import { muscleGroups } from "../data/muscleGroups";\nimport { muscleGroups } from "../data/muscleGroups";' in content:
    content = content.replace('import { muscleGroups } from "../data/muscleGroups";\nimport { muscleGroups } from "../data/muscleGroups";', 'import { muscleGroups } from "../data/muscleGroups";', 1)

if '  const [showSplitInsights, setShowSplitInsights] = useState(false);\n  const [showSplitInsights, setShowSplitInsights] = useState(false);' in content:
    content = content.replace('  const [showSplitInsights, setShowSplitInsights] = useState(false);\n  const [showSplitInsights, setShowSplitInsights] = useState(false);', '  const [showSplitInsights, setShowSplitInsights] = useState(false);', 1)

with open('src/screens/HomeScreen.tsx', 'w') as f:
    f.write(content)
print('Done')