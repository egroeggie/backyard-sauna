import { Body, Container, Head, Html, Img, Link, Preview, Section, Text } from '@react-email/components'

interface Props {
  name: string
  eventTitle: string
  patreonUrl?: string
}

const SITE = 'https://www.backyard-sauna.com'
const DEFAULT_PATREON = 'https://www.patreon.com/backyardsauna'

const styles = {
  body: { margin: '0', padding: '0', backgroundColor: '#1f3e2a' },
  outer: { backgroundColor: '#1f3e2a', padding: '32px 16px' },
  card: { maxWidth: '600px', width: '100%', border: '2px solid #edea5a', borderRadius: '8px', margin: '0 auto' },
  logoCell: { backgroundColor: '#1f3e2a', padding: '24px 32px', textAlign: 'center' as const, borderRadius: '6px 6px 0 0' },
  divider: { borderTop: '1px solid #edea5a', margin: '0 32px' },
  bodyCell: { padding: '32px 32px 8px', backgroundColor: '#1f3e2a' },
  h1: { margin: '0 0 8px', fontFamily: "'Dokdo', Arial, sans-serif", fontSize: '38px', fontWeight: 400, color: '#edea5a', textTransform: 'uppercase' as const, letterSpacing: '0.05em', lineHeight: '1.1' },
  subhead: { margin: '0 0 24px', fontFamily: 'Inter, Arial, sans-serif', fontSize: '14px', fontWeight: 600, color: '#edea5a', opacity: 0.7, letterSpacing: '0.05em', textTransform: 'uppercase' as const },
  body_text: { margin: '0 0 16px', fontFamily: 'Inter, Arial, sans-serif', fontSize: '14px', color: '#edea5a', lineHeight: '1.7' },
  box: { padding: '20px', border: '1px solid rgba(237,234,90,0.3)', borderRadius: '6px', backgroundColor: 'rgba(237,234,90,0.05)', marginBottom: '16px' },
  boxLabel: { margin: '0 0 10px', fontFamily: 'Inter, Arial, sans-serif', fontSize: '13px', fontWeight: 600, color: '#edea5a', textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
  boxText: { margin: '0 0 12px', fontFamily: 'Inter, Arial, sans-serif', fontSize: '14px', color: '#edea5a', lineHeight: '1.6' },
  ctaLink: { color: '#edea5a', fontWeight: 700, fontSize: '14px', textDecoration: 'underline' },
  signoff: { padding: '0 32px 32px', backgroundColor: '#1f3e2a' },
  signoffDivider: { borderTop: '1px solid rgba(237,234,90,0.3)', margin: '0 0 16px' },
  signoffText: { margin: '0 0 4px', fontFamily: 'Inter, Arial, sans-serif', fontSize: '14px', color: '#edea5a', opacity: 0.75 },
  footer: { padding: '16px 32px', borderTop: '1px solid rgba(237,234,90,0.2)', borderRadius: '0 0 6px 6px', backgroundColor: '#1f3e2a', textAlign: 'center' as const },
  footerText: { margin: '0', fontFamily: 'Inter, Arial, sans-serif', fontSize: '12px', color: '#edea5a', opacity: 0.5, lineHeight: '1.6' },
}

export function PostAttendanceEmail({ name, eventTitle, patreonUrl = DEFAULT_PATREON }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Thanks for coming to {eventTitle}</Preview>
      <Body style={styles.body}>
        <Section style={styles.outer}>
          <Container style={styles.card}>

            <Section style={styles.logoCell}>
              <Link href={SITE}>
                <Img src={`${SITE}/cropped-mini-logo.png`} width={130} height={100} alt="Backyard Sauna" />
              </Link>
            </Section>

            <hr style={styles.divider} />

            <Section style={styles.bodyCell}>
              <Text style={styles.h1}>Glad you made it.</Text>
              <Text style={styles.subhead}>Hi {name} — hope the heat treated you well.</Text>

              <Text style={styles.body_text}>
                Hope you enjoyed <strong>{eventTitle}</strong>. It means a lot that you came out.
              </Text>
              <Text style={{ ...styles.body_text, marginBottom: '24px' }}>
                We&apos;re not a wellness brand. We&apos;re just two people in Stockport who love sauna and want to make it easier for everyone to do too. If you want to follow what happens next — the real version, not the polished one — we write about it on Patreon.
              </Text>

              <div style={styles.box}>
                <Text style={styles.boxLabel}>Follow the journey</Text>
                <Text style={styles.boxText}>
                  Patreon is free to follow. We will post the sauna hunts, the fundraising, and how we want to make it fun as we move toward a permanent home.
                </Text>
                <Text style={{ ...styles.boxText, margin: '0' }}>
                  <Link href={patreonUrl} style={styles.ctaLink}>Follow us on Patreon →</Link>
                </Text>
              </div>

              <div style={{ ...styles.box, marginBottom: '24px' }}>
                <Text style={styles.boxLabel}>Back the campaign</Text>
                <Text style={styles.boxText}>
                  We&apos;re raising £30k to bring Backyard Sauna into a permanent home in Stockport. Every little helps — and there are rewards for the people who show up early.
                </Text>
                <Text style={{ ...styles.boxText, margin: '0' }}>
                  <Link href={`${SITE}/support/takepart`} style={styles.ctaLink}>Back the campaign →</Link>
                </Text>
              </div>
            </Section>

            <Section style={styles.signoff}>
              <hr style={styles.signoffDivider} />
              <Text style={styles.signoffText}>See you at the next one,</Text>
              <Text style={{ ...styles.signoffText, margin: '0' }}>George &amp; Cameron</Text>
            </Section>

            <Section style={styles.footer}>
              <Text style={styles.footerText}>
                You&apos;re receiving this because you attended a session at backyard-sauna.com.
              </Text>
            </Section>

          </Container>
        </Section>
      </Body>
    </Html>
  )
}
