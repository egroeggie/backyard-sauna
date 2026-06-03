import { Body, Container, Head, Html, Img, Link, Preview, Section, Text } from '@react-email/components'

interface Props { name?: string; eventTitle: string; eventDate: string; waiverUrl: string }

const SITE = 'https://www.backyard-sauna.com'

const styles = {
  body: { margin: '0', padding: '0', backgroundColor: '#1f3e2a' },
  outer: { backgroundColor: '#1f3e2a', padding: '32px 16px' },
  card: { maxWidth: '600px', width: '100%', border: '2px solid #edea5a', borderRadius: '8px', margin: '0 auto' },
  logoCell: { backgroundColor: '#1f3e2a', padding: '24px 32px', textAlign: 'center' as const, borderRadius: '6px 6px 0 0' },
  divider: { borderTop: '1px solid #edea5a', margin: '0 32px' },
  bodyCell: { padding: '32px 32px 8px', backgroundColor: '#1f3e2a' },
  h1: { margin: '0 0 8px', fontFamily: "'Dokdo', Arial, sans-serif", fontSize: '38px', fontWeight: 400, color: '#edea5a', textTransform: 'uppercase' as const, letterSpacing: '0.05em', lineHeight: '1.1' },
  subhead: { margin: '0 0 24px', fontFamily: 'Inter, Arial, sans-serif', fontSize: '14px', fontWeight: 600, color: '#edea5a', opacity: 0.7, letterSpacing: '0.05em', textTransform: 'uppercase' as const },
  box: { padding: '20px', border: '1px solid rgba(237,234,90,0.3)', borderRadius: '6px', backgroundColor: 'rgba(237,234,90,0.05)', marginBottom: '24px' },
  boxLabel: { margin: '0 0 14px', fontFamily: 'Inter, Arial, sans-serif', fontSize: '13px', fontWeight: 600, color: '#edea5a', textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
  row: { margin: '0 0 10px', fontFamily: 'Inter, Arial, sans-serif', fontSize: '14px', color: '#edea5a', lineHeight: '1.5' },
  waiverBox: { padding: '16px 20px', border: '1px solid rgba(233,69,96,0.5)', borderRadius: '6px', backgroundColor: 'rgba(233,69,96,0.08)', marginBottom: '24px' },
  waiverLabel: { margin: '0 0 8px', fontFamily: 'Inter, Arial, sans-serif', fontSize: '13px', fontWeight: 600, color: '#E94560', textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
  waiverText: { margin: '0 0 12px', fontFamily: 'Inter, Arial, sans-serif', fontSize: '14px', color: '#edea5a', lineHeight: '1.5' },
  waiverLink: { color: '#E94560', fontWeight: 600 },
  signoff: { padding: '0 32px 32px', backgroundColor: '#1f3e2a' },
  signoffDivider: { borderTop: '1px solid rgba(237,234,90,0.3)', margin: '0 0 16px' },
  signoffText: { margin: '0 0 4px', fontFamily: 'Inter, Arial, sans-serif', fontSize: '14px', color: '#edea5a', opacity: 0.75 },
  footer: { padding: '16px 32px', borderTop: '1px solid rgba(237,234,90,0.2)', borderRadius: '0 0 6px 6px', backgroundColor: '#1f3e2a', textAlign: 'center' as const },
  footerText: { margin: '0', fontFamily: 'Inter, Arial, sans-serif', fontSize: '12px', color: '#edea5a', opacity: 0.5, lineHeight: '1.6' },
}

export function WaiverLinkEmail({ name, eventTitle, eventDate, waiverUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Sign your waiver for {eventTitle}</Preview>
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
              <Text style={styles.h1}>Sign your waiver.</Text>
              {name
                ? <Text style={styles.subhead}>Hi {name} — one step before you arrive.</Text>
                : <Text style={styles.subhead}>One step before you arrive.</Text>
              }

              <div style={styles.box}>
                <Text style={styles.boxLabel}>{eventTitle}</Text>
                <Text style={{ ...styles.row, margin: '0' }}><strong>Date:</strong> {eventDate}</Text>
              </div>

              <div style={styles.waiverBox}>
                <Text style={styles.waiverLabel}>Action needed</Text>
                <Text style={styles.waiverText}>Please sign your waiver before arriving. It only takes a minute.</Text>
                <Text style={{ ...styles.waiverText, margin: '0' }}>
                  <Link href={waiverUrl} style={styles.waiverLink}>{waiverUrl}</Link>
                </Text>
              </div>
            </Section>

            <Section style={styles.signoff}>
              <hr style={styles.signoffDivider} />
              <Text style={styles.signoffText}>See you there,</Text>
              <Text style={{ ...styles.signoffText, margin: '0' }}>George &amp; Cameron</Text>
            </Section>

            <Section style={styles.footer}>
              <Text style={styles.footerText}>
                You&apos;re receiving this because you have an upcoming session at backyard-sauna.com.
              </Text>
            </Section>

          </Container>
        </Section>
      </Body>
    </Html>
  )
}
