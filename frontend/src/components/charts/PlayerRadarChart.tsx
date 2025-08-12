import React from 'react';
import { 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Tooltip,
  Legend 
} from 'recharts';
import { useTheme, Box, Typography, Chip } from '@mui/material';
import ChartWrapper, { BaseChartProps, getChartColors } from './ChartWrapper';

export interface PlayerSkillData {
  skill: string;
  value: number;
  fullMark: number;
  category?: 'physical' | 'technical' | 'mental' | 'social';
}

export interface PlayerData {
  playerId: string;
  playerName: string;
  skills: PlayerSkillData[];
  overallRating?: number;
  level?: number;
}

export interface PlayerRadarChartProps extends BaseChartProps {
  data: PlayerSkillData[];
  playerData?: PlayerData;
  showComparison?: boolean;
  comparisonData?: PlayerSkillData[];
  maxValue?: number;
  colorScheme?: string;
  showCategoryColors?: boolean;
}

const PlayerRadarChart: React.FC<PlayerRadarChartProps> = ({
  data,
  playerData,
  config = {},
  height = 400,
  loading = false,
  error = null,
  showComparison = false,
  comparisonData,
  maxValue = 100,
  colorScheme = 'default',
  showCategoryColors = true,
  onDataPointClick,
}) => {
  const theme = useTheme();
  const colors = getChartColors(theme, colorScheme);

  const categoryColors = {
    physical: colors[0],
    technical: colors[1],
    mental: colors[2],
    social: colors[3],
  };

  const getSkillColor = (skill: PlayerSkillData) => {
    if (showCategoryColors && skill.category) {
      return categoryColors[skill.category];
    }
    return colors[0];
  };

  const calculateOverallRating = (skills: PlayerSkillData[]) => {
    const average = skills.reduce((sum, skill) => sum + skill.value, 0) / skills.length;
    return Math.round(average);
  };

  const overallRating = playerData?.overallRating || calculateOverallRating(data);

  const renderChart = () => (
    <RadarChart 
      cx="50%" 
      cy="50%" 
      outerRadius="70%" 
      data={data}
      margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
    >
      <PolarGrid 
        stroke={theme.palette.divider}
        gridType="polygon"
      />
      <PolarAngleAxis 
        dataKey="skill" 
        tick={{ 
          fontSize: 12, 
          fill: theme.palette.text.primary 
        }}
      />
      <PolarRadiusAxis 
        angle={90} 
        domain={[0, maxValue]} 
        tick={{ 
          fontSize: 10, 
          fill: theme.palette.text.secondary 
        }}
        tickCount={5}
      />
      <Tooltip
        contentStyle={{
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 8,
          color: theme.palette.text.primary,
        }}
        formatter={(value: number, name: string) => [
          `${value}/${maxValue}`,
          name
        ]}
      />
      
      <Radar
        name={playerData?.playerName || "Player Skills"}
        dataKey="value"
        stroke={colors[0]}
        fill={colors[0]}
        fillOpacity={0.3}
        strokeWidth={2}
        dot={{ 
          r: 4, 
          fill: colors[0],
          stroke: colors[0],
          strokeWidth: 2
        }}
      />
      
      {showComparison && comparisonData && (
        <Radar
          name="Comparison"
          dataKey="value"
          stroke={colors[1]}
          fill={colors[1]}
          fillOpacity={0.1}
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={{ 
            r: 3, 
            fill: colors[1],
            stroke: colors[1],
            strokeWidth: 1
          }}
        />
      )}
      
      {config.showLegend !== false && <Legend />}
    </RadarChart>
  );

  const renderPlayerInfo = () => {
    if (!playerData) return null;

    return (
      <Box sx={{ mb: 2, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          {playerData.playerName}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
          <Chip 
            label={`Overall: ${overallRating}`} 
            color="primary" 
            size="small"
          />
          {playerData.level && (
            <Chip 
              label={`Level: ${playerData.level}`} 
              color="secondary" 
              size="small"
            />
          )}
        </Box>
      </Box>
    );
  };

  const renderSkillBreakdown = () => {
    if (!showCategoryColors) return null;

    const categories = data.reduce((acc, skill) => {
      if (skill.category) {
        if (!acc[skill.category]) {
          acc[skill.category] = [];
        }
        acc[skill.category].push(skill);
      }
      return acc;
    }, {} as Record<string, PlayerSkillData[]>);

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Skill Categories
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {Object.entries(categories).map(([category, skills]) => {
            const avgValue = skills.reduce((sum, skill) => sum + skill.value, 0) / skills.length;
            return (
              <Chip
                key={category}
                label={`${category}: ${Math.round(avgValue)}`}
                size="small"
                sx={{
                  backgroundColor: categoryColors[category as keyof typeof categoryColors],
                  color: 'white',
                }}
              />
            );
          })}
        </Box>
      </Box>
    );
  };

  return (
    <ChartWrapper
      title="Player Skills Analysis"
      subtitle={playerData ? `Skill breakdown for ${playerData.playerName}` : "Player skill radar chart"}
      loading={loading}
      error={error}
      height={height}
      onExport={(format) => console.log(`Exporting player radar as ${format}`)}
    >
      <Box>
        {renderPlayerInfo()}
        {renderChart()}
        {renderSkillBreakdown()}
      </Box>
    </ChartWrapper>
  );
};

export default PlayerRadarChart;

// Sample data generators
export const generateSamplePlayerSkills = (): PlayerSkillData[] => [
  { skill: 'Speed', value: 85, fullMark: 100, category: 'physical' },
  { skill: 'Accuracy', value: 92, fullMark: 100, category: 'technical' },
  { skill: 'Strategy', value: 78, fullMark: 100, category: 'mental' },
  { skill: 'Teamwork', value: 88, fullMark: 100, category: 'social' },
  { skill: 'Endurance', value: 75, fullMark: 100, category: 'physical' },
  { skill: 'Leadership', value: 82, fullMark: 100, category: 'social' },
  { skill: 'Focus', value: 90, fullMark: 100, category: 'mental' },
  { skill: 'Ball Control', value: 87, fullMark: 100, category: 'technical' },
];

export const generateSamplePlayerData = (): PlayerData => ({
  playerId: '1',
  playerName: 'Alex Chen',
  level: 15,
  skills: generateSamplePlayerSkills(),
  overallRating: 85,
});