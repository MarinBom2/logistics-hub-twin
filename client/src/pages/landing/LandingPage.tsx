import { Link } from 'react-router-dom'
import { CENTER_CONFIGS } from '../../features/twin/sim/centers'
import { SECTIONS, demoPath, sectionPath, signupPath } from '../../routes'
import { AVAILABILITY_LABEL, CAPABILITIES, PILOT, PLANS, PROBLEMS, STEPS, TRUST } from './content'
import { HeroTwin } from './HeroTwin'
import { LeadForm } from './LeadForm'
import { RoiCalculator } from './RoiCalculator'
import './landing.css'

/** SCR-00 영업 랜딩. 택배사·3PL 허브의 운영·IT 책임자가 읽는다 (md/business-plan.md §2) */
export default function LandingPage() {
  const demo = demoPath(CENTER_CONFIGS[0].id)

  return (
    <div className="landing">
      <section className="hero wrap">
        <div className="hero-copy">
          <p className="eyebrow-text">택배·3PL 허브를 위한 상하차 관제 디지털 트윈</p>
          <h1>
            트럭이 빈 칸을 싣고
            <br />
            떠나기 전에.
          </h1>
          <p className="lead">
            레일 유입부터 간선 출발까지, 허브의 모든 박스를 한 화면에서 실시간으로 봅니다. 지금 쓰는 설비와 WCS 는 그대로 두고 읽기 전용으로
            붙입니다.
          </p>
          <div className="cta-row">
            <Link to={sectionPath(SECTIONS.contact)} className="btn primary large">
              8주 파일럿 문의
            </Link>
            <Link to={demo} className="btn large">
              라이브 데모 열기
            </Link>
          </div>
          <Link to={sectionPath(SECTIONS.roi)} className="text-link">
            우리 허브에서 새는 비용 계산해 보기 →
          </Link>
        </div>
        <HeroTwin />
      </section>

      <section className="section wrap" aria-labelledby="problem-title">
        <p className="eyebrow-text">문제</p>
        <h2 id="problem-title">허브의 비용은 보이지 않는 곳에서 샙니다</h2>
        <div className="grid-3">
          {PROBLEMS.map((item) => (
            <article key={item.title} className="card plain">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
        <blockquote className="principle">
          허브 운영을 숫자 두 개로 줄이면 이렇습니다. <b>트럭 한 대가 얼마나 차서 떠나는가</b>, 그리고 <b>박스 하나가 몇 초 멈춰 있는가</b>. Hub
          Twin 은 이 두 숫자를 실시간으로 보이게 만드는 데서 시작합니다.
        </blockquote>
      </section>

      <section id={SECTIONS.product} className="section wrap" aria-labelledby="product-title">
        <p className="eyebrow-text">제품</p>
        <h2 id="product-title">보고, 먼저 알리고, 이유를 설명합니다</h2>
        <ol className="steps">
          {STEPS.map((step) => (
            <li key={step.no}>
              <span className="no">{step.no}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="grid-cap">
          {CAPABILITIES.map((item) => (
            <article key={item.title} className="card plain cap">
              <div className="cap-head">
                <h3>{item.title}</h3>
                <span className={`badge ${item.availability === 'soon' ? 'soon' : 'live'}`}>{AVAILABILITY_LABEL[item.availability]}</span>
              </div>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id={SECTIONS.roi} className="section wrap" aria-labelledby="roi-title">
        <p className="eyebrow-text">효과 계산</p>
        <h2 id="roi-title">구독료보다 많이 아끼는지, 먼저 계산해 보세요</h2>
        <p className="section-lead">허브 숫자 다섯 개면 됩니다. 모르는 값은 기본값(가정)으로 두고, 파일럿에서 실측으로 바꿉니다.</p>
        <RoiCalculator />
      </section>

      <section id={SECTIONS.pilot} className="section wrap" aria-labelledby="pilot-title">
        <p className="eyebrow-text">도입 방식</p>
        <h2 id="pilot-title">8주 파일럿. 숫자가 움직이지 않으면 계약하지 않으셔도 됩니다</h2>
        <ol className="timeline">
          {PILOT.map((phase) => (
            <li key={phase.weeks}>
              <span className="weeks">{phase.weeks}</span>
              <h3>{phase.title}</h3>
              <p>{phase.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id={SECTIONS.pricing} className="section wrap" aria-labelledby="pricing-title">
        <p className="eyebrow-text">가격</p>
        <h2 id="pricing-title">허브 단위로, 사용자 수와 상관없이</h2>
        <div className="grid-3 plans">
          {PLANS.map((plan) => (
            <article key={plan.name} className={plan.featured ? 'card plan featured' : 'card plan'}>
              <h3>{plan.name}</h3>
              <p className="price">{plan.price}</p>
              <p className="unit">{plan.unit}</p>
              <ul>
                {plan.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <Link to={plan.name === '파일럿' ? signupPath() : sectionPath(SECTIONS.contact)} className={plan.featured ? 'btn primary' : 'btn'}>
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section wrap" aria-labelledby="trust-title">
        <p className="eyebrow-text">보안과 운영</p>
        <h2 id="trust-title">현장이 멈추는 일은 만들지 않습니다</h2>
        <div className="grid-3">
          {TRUST.map((item) => (
            <article key={item.title} className="card plain">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id={SECTIONS.contact} className="section wrap contact" aria-labelledby="contact-title">
        <div>
          <p className="eyebrow-text">도입 문의</p>
          <h2 id="contact-title">허브 한 곳으로 시작하세요</h2>
          <p className="section-lead">
            운영 중인 허브와 지금 가장 아픈 지점을 알려 주시면, 파일럿에서 연결할 설비와 측정할 지표를 정리해 드립니다. 먼저 써 보고 싶다면{' '}
            <Link to={signupPath()}>워크스페이스를 바로 만들</Link> 수도 있습니다.
          </p>
        </div>
        <LeadForm />
      </section>

      <footer className="landing-footer wrap">
        <span>Hub Twin · 상하차 관제 디지털 트윈</span>
        <span>화면의 센터 구성·처리량·목적지는 시뮬레이션 값이며 특정 기업과 무관합니다.</span>
      </footer>
    </div>
  )
}
