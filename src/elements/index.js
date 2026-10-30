import { auto } from './auto.js';
import { cavok } from './cavok.js';
import { minimumVisibility } from './minimum-visibility.js';
import { nil } from './nil.js';
import { observationTime } from './observation-time.js';
import { pressure } from './pressure.js';
import { recentWeather } from './recent-weather.js';
import { remarks } from './remarks.js';
import { reportType } from './report-type.js';
import { rvr } from './rvr.js';
import { sky } from './sky.js';
import { station } from './station.js';
import { temperature } from './temperature.js';
import { trend } from './trend.js';
import { visibility } from './visibility.js';
import { weather } from './weather.js';
import { windShear } from './wind-shear.js';
import { windVariation } from './wind-variation.js';
import { wind } from './wind.js';

/** Elements in report order. The pipeline depends on this order. */
export const REPORT_ELEMENTS = [
  reportType,
  station,
  observationTime,
  nil,
  auto,
  wind,
  windVariation,
  cavok,
  visibility,
  minimumVisibility,
  rvr,
  weather,
  sky,
  temperature,
  pressure,
  recentWeather,
  windShear,
  trend,
  remarks,
];
