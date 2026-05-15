import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'

interface Props { name: string; eventTitle: string; eventDate: string }

export function WaiverConfirmationEmail({ name, eventTitle, eventDate }: Props) {
  return (
    <Html><Head />
      <Preview>Waiver signed for {eventTitle}</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f4f4f4', padding: '24px' }}>
        <Container style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '8px' }}>
          <Heading style={{ color: '#1A1A2E' }}>Waiver signed.</Heading>
          <Text>Hi {name},</Text>
          <Text>You're all set — your waiver for <strong>{eventTitle}</strong> on {eventDate} has been signed. No further action needed.</Text>
          <Text style={{ color: '#666', fontSize: '14px' }}>— The Backyard Sauna team</Text>
        </Container>
      </Body>
    </Html>
  )
}
