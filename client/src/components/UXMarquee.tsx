import React from "react";
import { Star } from "lucide-react";

type Testimonial = {
  firstName: string;
  lastName: string;
  text: string;
  stars: number;
};

const testimonials: Testimonial[] = [
  { firstName: "Asha", lastName: "Patel", text: "Tracking my harvest to market reduced spoilage and got me paid faster.", stars: 5 },
  { firstName: "Randhir Kumar", lastName: "Raj", text: "The QR batches and live updates are a game changer for small farmers.", stars: 4 },
  { firstName: "Meera", lastName: "Kaur", text: "Easy to use and saved me time coordinating deliveries.", stars: 5 },
  { firstName: "Amit", lastName: "Rao", text: "Clear records and faster trust from buyers — highly recommend.", stars: 5 },
  { firstName: "Rohit", lastName: "Kumar", text: "The working flow is very smooth and highly capable.", stars: 5}
];

const initials = (t: Testimonial) => {
  const f = t.firstName?.trim()?.[0] ?? "";
  const l = t.lastName?.trim()?.[0] ?? "";
  return `${f}${l}`.toUpperCase();
};

const UXMarquee: React.FC = () => {
  // Duplicate list so marquee looks continuous
  const items = [...testimonials, ...testimonials];

  return (
    <div className="ux-marquee">
      <div className="ux-header">
        <h3>User Experience</h3>
        <p>Real feedback from platform users and farmers</p>
      </div>

      <div className="marquee-viewport" aria-hidden={false}>
        <div className="marquee-track">
          {items.map((t, i) => (
            <div key={`${t.firstName}-${i}`} className="testimonial-card" tabIndex={0}>
              <div className="avatar">{initials(t)}</div>
              <div className="testimonial-body">
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-meta">
                  <div className="user-name">{t.firstName} {t.lastName}</div>
                  <div className="stars" aria-hidden>
                    {Array.from({ length: t.stars }).map((_, si) => (
                      <Star key={si} className="star-icon" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UXMarquee;
