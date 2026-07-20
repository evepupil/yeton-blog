import { Chip } from "@heroui/react/chip";

import type { SiteLocale, TechnologyStage } from "@/lib/site-config";
import { siteConfig } from "@/lib/site-config";

import { aboutContent } from "./about-content";

interface TechnologyRadarProps {
  readonly locale: SiteLocale;
}

interface RadarSlot {
  readonly anchor: "end" | "middle" | "start";
  readonly dx: number;
  readonly dy: number;
  readonly x: number;
  readonly y: number;
}

const radarSlots: Readonly<Record<TechnologyStage, readonly RadarSlot[]>> = {
  adopt: [
    { anchor: "end", dx: -10, dy: -12, x: 254, y: 186 },
    { anchor: "start", dx: 12, dy: 4, x: 326, y: 204 },
    { anchor: "middle", dx: 0, dy: 24, x: 278, y: 266 },
  ],
  assess: [
    { anchor: "end", dx: -10, dy: -10, x: 178, y: 82 },
    { anchor: "start", dx: 10, dy: 20, x: 424, y: 328 },
    { anchor: "start", dx: 10, dy: -10, x: 424, y: 112 },
    { anchor: "end", dx: -10, dy: 20, x: 142, y: 330 },
  ],
  trial: [
    { anchor: "end", dx: -12, dy: -10, x: 202, y: 162 },
    { anchor: "start", dx: 12, dy: -8, x: 378, y: 152 },
    { anchor: "start", dx: 12, dy: 18, x: 372, y: 292 },
    { anchor: "end", dx: -12, dy: 22, x: 188, y: 300 },
    { anchor: "middle", dx: 0, dy: -14, x: 280, y: 112 },
  ],
};

export function TechnologyRadar({ locale }: TechnologyRadarProps) {
  const content = aboutContent[locale].radar;
  const stageIndexes: Record<TechnologyStage, number> = {
    adopt: 0,
    assess: 0,
    trial: 0,
  };

  return (
    <article
      aria-labelledby="technology-radar-title"
      className="about-radar-section"
    >
      <header className="about-section-heading about-section-heading-compact">
        <div>
          <span className="section-index">03</span>
          <h2 id="technology-radar-title">{content.heading}</h2>
        </div>
        <p>{content.description}</p>
      </header>

      <div className="about-radar-wrap">
        <svg
          aria-labelledby="technology-radar-svg-title technology-radar-svg-description"
          className="about-tech-radar"
          role="img"
          viewBox="0 0 560 440"
        >
          <title id="technology-radar-svg-title">{content.heading}</title>
          <desc id="technology-radar-svg-description">
            Adopt, Trial and Assess technology stages.
          </desc>
          <circle className="about-radar-ring" cx="280" cy="220" r="186" />
          <circle className="about-radar-ring" cx="280" cy="220" r="126" />
          <circle
            className="about-radar-ring about-radar-adopt-ring"
            cx="280"
            cy="220"
            r="68"
          />
          <line
            className="about-radar-axis"
            x1="280"
            x2="280"
            y1="34"
            y2="406"
          />
          <line
            className="about-radar-axis"
            x1="94"
            x2="466"
            y1="220"
            y2="220"
          />
          <text className="about-radar-ring-label" x="280" y="225">
            ADOPT
          </text>
          <text className="about-radar-ring-label" x="280" y="105">
            TRIAL
          </text>
          <text className="about-radar-ring-label" x="280" y="48">
            ASSESS
          </text>

          {siteConfig.profileStatus.technologyRadar.map((technology) => {
            const slots = radarSlots[technology.stage];
            const index = stageIndexes[technology.stage]++;
            const slot = slots[index % slots.length]!;
            return (
              <g
                className={`about-radar-point about-radar-point-${technology.stage}`}
                key={technology.name}
                transform={`translate(${slot.x} ${slot.y})`}
              >
                <circle r="6" />
                <text dx={slot.dx} dy={slot.dy} textAnchor={slot.anchor}>
                  {technology.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <dl className="about-radar-legend">
        {(["adopt", "trial", "assess"] as const).map((stage) => (
          <div key={stage}>
            <dt>
              <Chip size="sm" variant="soft">
                {content.stages[stage][0]}
              </Chip>
            </dt>
            <dd>{content.stages[stage][1]}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
