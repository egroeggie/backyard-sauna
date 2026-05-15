import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from '@react-email/components'

interface Props {
  name: string; eventTitle: string; eventDate: string
  slotStartTime: string; slotEndTime: string; location: string
  unsignedWaiverLinks: string[]
}

export function ReminderEmail({ name, eventTitle, eventDate, slotStartTime, slotEndTime, location, unsignedWaiverLinks }: Props) {
  return (
    <Html><Head />
      <Preview>Reminder: {eventTitle} is tomorrow</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f4f4f4', padding: '24px' }}>
        <Container style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '8px' }}>
          <Heading style={{ color: '#1A1A2E' }}>See you tomorrow.</Heading>
          <Text>Hi {name},</Text>
          <Text>Just a reminder — you're booked in for <strong>{eventTitle}</strong> tomorrow.</Text>
          <Section>
            <Text><strong>Date:</strong> {eventDate}</Text>
            <Text><strong>Time:</strong> {slotStartTime} – {slotEndTime}</Text>
            <Text><strong>Location:</strong> {location}</Text>
          </Section>
          {unsignedWaiverLinks.length > 0 && (<>
            <Hr />
            <Heading as="h2" style={{ fontSize: '18px', color: '#E94560' }}>Action needed: unsigned waivers</Heading>
            <Text>Please get these signed before you arrive:</Text>
            {unsignedWaiverLinks.map((link, i) => <Text key={i}><Link href={link}>{link}</Link></Text>)}
          </>)}
          <Hr />
          <Text style={{ color: '#666', fontSize: '14px' }}>— The Backyard Sauna team</Text>
        </Container>
      </Body>
    </Html>
  )
}
