import { Body, Container, Head, Html, Img, Link, Preview, Section, Text } from '@react-email/components'

interface Props {
  name: string; eventTitle: string; eventDate: string
  slotStartTime: string; slotEndTime: string; location: string
  unsignedWaiverLinks: string[]
}

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
  box: { padding: '20px', border: '1px solid rgba(237,234,90,0.3)', borderRadius: '6px', backgroundColor: 'rgba(237,234,90,0.05)', marginBottom: '16px' },
  boxLabel: { margin: '0 0 14px', fontFamily: 'Inter, Arial, sans-serif', fontSize: '13px', fontWeight: 600, color: '#edea5a', textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
  row: { margin: '0 0 10px', fontFamily: 'Inter, Arial, sans-serif', fontSize: '14px', color: '#edea5a', lineHeight: '1.5' },
  rowLast: { margin: '0', fontFamily: 'Inter, Arial, sans-serif', fontSize: '14px', color: '#edea5a', lineHeight: '1.5' },
  optional: { margin: '0', fontFamily: 'Inter, Arial, sans-serif', fontSize: '13px', color: '#edea5a', opacity: 0.75, lineHeight: '1.5' },
  waiverBox: { padding: '16px 20px', border: '1px solid rgba(233,69,96,0.5)', borderRadius: '6px', backgroundColor: 'rgba(233,69,96,0.08)', marginBottom: '20px' },
  waiverLabel: { margin: '0 0 8px', fontFamily: 'Inter, Arial, sans-serif', fontSize: '13px', fontWeight: 600, color: '#E94560', textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
  waiverText: { margin: '0 0 10px', fontFamily: 'Inter, Arial, sans-serif', fontSize: '14px', color: '#edea5a', lineHeight: '1.5' },
  waiverLink: { color: '#E94560', fontWeight: 600 },
  signoff: { padding: '0 32px 32px', backgroundColor: '#1f3e2a' },
  signoffDivider: { borderTop: '1px solid rgba(237,234,90,0.3)', margin: '0 0 16px' },
  signoffText: { margin: '0 0 4px', fontFamily: 'Inter, Arial, sans-serif', fontSize: '14px', color: '#edea5a', opacity: 0.75 },
  footer: { padding: '16px 32px', borderTop: '1px solid rgba(237,234,90,0.2)', borderRadius: '0 0 6px 6px', backgroundColor: '#1f3e2a', textAlign: 'center' as const },
  footerText: { margin: '0', fontFamily: 'Inter, Arial, sans-serif', fontSize: '12px', color: '#edea5a', opacity: 0.5, lineHeight: '1.6' },
}

export function ReminderEmail({ name, eventTitle, eventDate, slotStartTime, slotEndTime, location, unsignedWaiverLinks }: Props) {
  return (
    <Html>
      <Head />
      <Preview>See you tomorrow — {eventTitle}</Preview>
      <Body style={styles.body}>
        <Section style={styles.outer}>
          <Container style={styles.card}>

            {/* Logo */}
            <Section style={styles.logoCell}>
              <Link href={SITE}>
                <Img src={`${SITE}/cropped-mini-logo.png`} width={130} height={100} alt="Backyard Sauna" />
              </Link>
            </Section>

            <hr style={styles.divider} />

            {/* Body */}
            <Section style={styles.bodyCell}>
              <Text style={styles.h1}>See you tomorrow.</Text>
              <Text style={styles.subhead}>Hi {name} — your slot is confirmed.</Text>

              {/* Booking details */}
              <div style={styles.box}>
                <Text style={styles.boxLabel}>{eventTitle}</Text>
                <Text style={styles.row}><strong>Date:</strong> {eventDate}</Text>
                <Text style={styles.row}><strong>Time:</strong> {slotStartTime} – {slotEndTime}</Text>
                <Text style={styles.rowLast}><strong>Location:</strong> {location}</Text>
              </div>

              {/* Unsigned waivers */}
              {unsignedWaiverLinks.length > 0 && (
                <div style={styles.waiverBox}>
                  <Text style={styles.waiverLabel}>Action needed: unsigned waivers</Text>
                  <Text style={styles.waiverText}>Please get these signed before you arrive:</Text>
                  {unsignedWaiverLinks.map((link, i) => (
                    <Text key={i} style={{ ...styles.waiverText, margin: '0 0 6px' }}>
                      <Link href={link} style={styles.waiverLink}>{link}</Link>
                    </Text>
                  ))}
                </div>
              )}

              {/* What to bring */}
              <div style={styles.box}>
                <Text style={styles.boxLabel}>What to bring</Text>
                <Text style={styles.row}><strong>Towel</strong> — you'll need it</Text>
                <Text style={styles.row}><strong>Flip flops</strong> — the ground gets hot</Text>
                <Text style={styles.row}><strong>Swimwear</strong> — mandatory on site</Text>
                <Text style={styles.rowLast}><strong>Water bottle</strong> — stay hydrated, especially between rounds</Text>
              </div>

              {/* Getting here */}
              <div style={styles.box}>
                <Text style={styles.boxLabel}>Getting here</Text>
                <Text style={styles.row}><strong>Address:</strong> The Apple Core, 26 Middle Hillgate, Stockport SK1 3AY</Text>
                <Text style={styles.row}>We're set up out the back — come through the front, the team will be there from 10</Text>
                <Text style={styles.row}><strong>Arrive 15 minutes before your slot</strong> — even earlier if you want to sit and have something to drink</Text>
                <Text style={styles.row}>There's no indoor changing. We have zip-up cubicles to change in our marquee before your session</Text>
                <Text style={styles.rowLast}>A member of the team will greet you, check your waiver, and talk you through the flow</Text>
              </div>

              {/* Waiver reminder */}
              {unsignedWaiverLinks.length === 0 && (
                <div style={{ ...styles.box, marginBottom: '24px' }}>
                  <Text style={styles.boxLabel}>Before you arrive</Text>
                  <Text style={styles.rowLast}>Make sure you&apos;ve signed your waiver — everyone in your group needs one. Check your booking confirmation email if you need the link.</Text>
                </div>
              )}

              <Text style={{ ...styles.row, fontSize: '16px', marginBottom: '28px' }}>
                Any questions before tomorrow, just reply to this email.
              </Text>
            </Section>

            {/* Sign off */}
            <Section style={styles.signoff}>
              <hr style={styles.signoffDivider} />
              <Text style={styles.signoffText}>See you there,</Text>
              <Text style={{ ...styles.signoffText, margin: '0' }}>George &amp; Cameron</Text>
            </Section>

            {/* Footer */}
            <Section style={styles.footer}>
              <Text style={styles.footerText}>
                You're receiving this because you have a booking at backyard-sauna.com.
              </Text>
            </Section>

          </Container>
        </Section>
      </Body>
    </Html>
  )
}
