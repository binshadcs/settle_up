import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, formatCurrency } from '@/lib/storage';

type RangeType = 'day' | 'week' | 'month';

interface OwedSettledChartProps {
  activities: Activity[];
}

interface ChartPoint {
  key: string;
  label: string;
  owed: number;
  settled: number;
}

const dayMs = 24 * 60 * 60 * 1000;

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfWeek = (date: Date) => {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
};

const startOfMonth = (date: Date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatWeekLabel = (date: Date) => {
  const end = new Date(date);
  end.setDate(end.getDate() + 6);
  return `${date.toLocaleDateString('en-IN', { day: 'numeric' })}-${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
};

const toDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const toMonthKey = (date: Date) => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${y}-${m}`;
};

const buildBuckets = (range: RangeType) => {
  const now = new Date();
  const points: ChartPoint[] = [];

  if (range === 'day') {
    for (let i = 6; i >= 0; i -= 1) {
      const day = startOfDay(new Date(now.getTime() - i * dayMs));
      points.push({
        key: toDateKey(day),
        label: day.toLocaleDateString('en-IN', { weekday: 'short' }),
        owed: 0,
        settled: 0,
      });
    }
    return points;
  }

  if (range === 'week') {
    const thisWeek = startOfWeek(now);
    for (let i = 7; i >= 0; i -= 1) {
      const week = new Date(thisWeek);
      week.setDate(week.getDate() - i * 7);
      points.push({
        key: toDateKey(week),
        label: formatWeekLabel(week),
        owed: 0,
        settled: 0,
      });
    }
    return points;
  }

  const thisMonth = startOfMonth(now);
  for (let i = 5; i >= 0; i -= 1) {
    const month = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - i, 1);
    points.push({
      key: toMonthKey(month),
      label: month.toLocaleDateString('en-IN', { month: 'short' }),
      owed: 0,
      settled: 0,
    });
  }
  return points;
};

const getBucketKey = (date: Date, range: RangeType) => {
  if (range === 'day') return toDateKey(startOfDay(date));
  if (range === 'week') return toDateKey(startOfWeek(date));
  return toMonthKey(startOfMonth(date));
};

const OwedSettledChart = ({ activities }: OwedSettledChartProps) => {
  const [range, setRange] = useState<RangeType>('month');

  const chartData = useMemo(() => {
    const buckets = buildBuckets(range);
    const bucketMap = new Map(buckets.map((b) => [b.key, b]));

    activities.forEach((activity) => {
      const activityDate = new Date(activity.createdAt);
      const bucket = bucketMap.get(getBucketKey(activityDate, range));
      if (!bucket) return;

      if (activity.type === 'created') {
        bucket.owed += activity.amount;
      } else {
        bucket.settled += activity.amount;
      }
    });

    return buckets;
  }, [activities, range]);

  return (
    <div className="card-elevated p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Owed vs Settled</p>
          <p className="text-xs text-muted-foreground">Track dues and repayments</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-muted/70 p-1">
          {(['day', 'week', 'month'] as const).map((item) => (
            <button
              key={item}
              onClick={() => setRange(item)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition-colors ${
                range === item ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap={10}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.35} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => {
                const numeric = Number(value);
                if (numeric >= 1000) return `₹${Math.round(numeric / 1000)}k`;
                return `₹${Math.round(numeric)}`;
              }}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--secondary) / 0.4)' }}
              contentStyle={{
                borderRadius: 12,
                borderColor: 'hsl(var(--border))',
                backgroundColor: 'hsl(var(--card))',
              }}
              formatter={(value: number, name: string) => [formatCurrency(Number(value)), name === 'owed' ? 'Owed' : 'Settled']}
            />
            <Bar dataKey="owed" fill="hsl(var(--warning))" radius={[6, 6, 0, 0]} />
            <Bar dataKey="settled" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full bg-warning" />
          Owed
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full bg-success" />
          Settled
        </div>
      </div>
    </div>
  );
};

export default OwedSettledChart;
