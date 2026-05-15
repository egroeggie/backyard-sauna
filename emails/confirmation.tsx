import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from '@react-email/components'

interface Props {
  name: string; eventTitle: string; eventDate: string
  slotStartTime: string; slotEndTime: string; location: string
  spaces: number; waiverLinks: string[]
}

export function ConfirmationEmail({ name, eventTitle, eventDate, slotStartTime, slotEndTime, location, spaces, waiverLinks }: Props) {
  return (
    <Html><Head />
      <Preview>You're booked in for {eventTitle}</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f4f4f4', padding: '24px' }}>
        <Container style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '8px' }}>
          <Heading style={{ color: '#1A1A2E' }}>You're booked in.</Heading>
          <Text>Hi {name},</Text>
          <Text>You've reserved {spaces} space{spaces > 1 ? 's' : ''} at <strong>{eventTitle}</strong>.</Text>
          <Section>
            <Text><strong>Date:</strong> {eventDate}</Text>
            <Text><strong>Time:</strong> {slotStartTime} – {slotEndTime}</Text>
            <Text><strong>Location:</strong> {location}</Text>
          </Section>
          <Hr />
          <Heading as="h2" style={{ fontSize: '18px' }}>Waivers</Heading>
          <Text>Everyone in your group needs to sign a waiver before arriving. Forward each link below to the right person.</Text>
          {waiverLinks.map((link, i) => (
            <Text key={i}>Person {i + 1}: <Link href={link}>{link}</Link></Text>
          ))}
          <Hr />
          <Text style={{ color: '#666', fontSize: '14px' }}>Bring a towel, flip flops, and water. See you there.</Text>
          <Text style={{ color: '#666', fontSize: '14px' }}>— The Backyard Sauna team</Text>
        </Container>
      </Body>
    </Html>
  )
}
