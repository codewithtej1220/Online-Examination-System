import { Trophy, Star, Award, Target } from 'lucide-react';
import { Card, CardContent } from './ui/card';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: typeof Trophy;
  unlocked: boolean;
  progress?: number;
}

interface GamificationProps {
  achievements: Achievement[];
  points: number;
  level: number;
  streak: number;
}

export default function Gamification({ achievements, points, level, streak }: GamificationProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-indigo-500/10 p-3">
                <Star className="h-6 w-6 text-indigo-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Points</p>
                <p className="text-2xl font-bold">{points}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-emerald-500/10 p-3">
                <Trophy className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Level</p>
                <p className="text-2xl font-bold">{level}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-orange-500/10 p-3">
                <Target className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold">{streak} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-amber-500/10 p-3">
                <Award className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Badges</p>
                <p className="text-2xl font-bold">{achievements.filter(a => a.unlocked).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3">
        {achievements.map(achievement => (
          <Card key={achievement.id} className={achievement.unlocked ? 'border-emerald-500/50' : ''}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`rounded-full p-3 ${achievement.unlocked ? 'bg-emerald-500/10' : 'bg-muted'}`}>
                <achievement.icon className={`h-6 w-6 ${achievement.unlocked ? 'text-emerald-500' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{achievement.name}</h4>
                <p className="text-sm text-muted-foreground">{achievement.description}</p>
                {achievement.progress !== undefined && !achievement.unlocked && (
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-indigo-500 transition-all" style={{ width: `${achievement.progress}%` }} />
                  </div>
                )}
              </div>
              {achievement.unlocked && (
                <Award className="h-6 w-6 text-amber-500" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
