/**
 * Analytics Engine
 * Tracks metrics, trends, and generates insights
 */

const { getMetricsHistory, getEvents } = require('./db');

function calculateVelocity(team) {
  // Estimate commits/hour from progress rate
  return Math.random() * 3; // Placeholder: would track from git in production
}

function predictCompletion(team) {
  const remaining = 100 - team.prog;
  const velocity = calculateVelocity(team);
  const hoursRemaining = remaining / (velocity * 8); // 8h per day

  const timelineHours = {
    'weekend': 48,
    'sprint': 30 * 24,
    'roadmap': 180 * 24,
  };

  const hoursAvailable = timelineHours[team.timeline] || 720;
  return {
    hoursRemaining,
    hoursAvailable,
    onTrack: hoursRemaining <= hoursAvailable * 0.8,
    percentOfTimeline: (hoursRemaining / hoursAvailable) * 100,
  };
}

function calculateTeamHealth(team) {
  const completion = team.prog / 100;
  const missedCheckinPenalty = team.missedCheckins.length * 0.1;
  const statusBonus = team.status === 'on-track' ? 0.1 : -0.15;

  const health = Math.max(0, Math.min(1, completion + statusBonus - missedCheckinPenalty));
  return {
    score: (health * 100).toFixed(1),
    status: health >= 0.7 ? 'Healthy' : health >= 0.4 ? 'At Risk' : 'Critical',
  };
}

function detectTrends(teams) {
  const trends = {
    improving: [],
    declining: [],
    stalled: [],
  };

  teams.forEach((team) => {
    if (team.status === 'on-track' && team.prog > 70) trends.improving.push(team.id);
    if (team.status === 'at-risk' && team.prog < 40) trends.declining.push(team.id);
    if (team.prog < 30 && team.timeline !== 'roadmap') trends.stalled.push(team.id);
  });

  return trends;
}

function generateInsights(state) {
  const insights = [];
  const teamsByStatus = {
    'on-track': state.teams.filter(t => t.status === 'on-track').length,
    'at-risk': state.teams.filter(t => t.status === 'at-risk').length,
  };

  if (teamsByStatus['at-risk'] > 3) {
    insights.push('⚠️  More than 3 teams at risk. Consider resource reallocation.');
  }

  const highAnomalies = state.anomalies.filter(a => a.severity === 'high' && !a.resolved);
  if (highAnomalies.length > 0) {
    insights.push(`🔴 ${highAnomalies.length} unresolved high-severity anomalies require immediate action.`);
  }

  const trends = detectTrends(state.teams);
  if (trends.stalled.length > 0) {
    insights.push(`⏸️  Teams ${trends.stalled.join(', ')} appear stalled. Check for blockers.`);
  }

  const avgProgress = (state.teams.reduce((sum, t) => sum + t.prog, 0) / state.teams.length).toFixed(0);
  insights.push(`📊 Average team progress: ${avgProgress}%`);

  return insights;
}

function getTeamMetrics(team) {
  const health = calculateTeamHealth(team);
  const prediction = predictCompletion(team);
  return {
    teamId: team.id,
    task: team.task,
    progress: team.prog,
    health,
    prediction,
    missedCheckins: team.missedCheckins.length,
    members: team.members.length,
  };
}

module.exports = {
  calculateVelocity,
  predictCompletion,
  calculateTeamHealth,
  detectTrends,
  generateInsights,
  getTeamMetrics,
};
