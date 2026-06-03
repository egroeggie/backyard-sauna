import { Body, Container, Head, Heading, Hr, Html, Img, Link, Preview, Text } from '@react-email/components'

interface Props {
  name: string
  eventTitle: string
  patreonUrl?: string
}

const SITE = 'https://www.backyard-sauna.com'
const DEFAULT_PATREON = 'https://www.patreon.com/backyardsauna'

export function PostAttendanceEmail({ name, eventTitle, patreonUrl = DEFAULT_PATREON }: Props) {
  return (
    <Html><Head />
      <Preview>Thanks for coming to {eventTitle}</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f4f4f4', padding: '24px' }}>
        <Container style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '8px' }}>
          <Link href={SITE}>
            <Img
              src={`${SITE}/cropped-mini-logo.png`}
              alt="Backyard Sauna"
              width={130}
              height={100}
              style={{ display: 'block', marginBottom: '24px' }}
            />
          </Link>
          <Heading style={{ color: '#1A1A2E' }}>Glad you made it.</Heading>
          <Text>Hi {name},</Text>
          <Text>Hope you enjoyed <strong>{eventTitle}</strong>. It means a lot that you came out.</Text>
          <Text>We're not a wellness brand. We're just two people in Stockport who built a couple of tent saunas and wanted to share them. If you want to follow what happens next — the real version, not the polished one — we write about it on Patreon.</Text>
          <Text><Link href={patreonUrl}>Follow us on Patreon →</Link></Text>
          <Hr />
          <Heading as="h2" style={{ fontSize: '18px', color: '#1A1A2E' }}>Help us build something permanent</Heading>
          <Text>We're raising £30k to take Backyard Sauna into a permanent home at Robinson's Brewery in Stockport. It's a crowdfunder — all or nothing — so if this sounds like something the world needs more of, now's the time to back it.</Text>
          <Text><Link href={`${SITE}/support/takepart`}>Back the campaign →</Link></Text>
          <Hr />
          <Text style={{ color: '#666', fontSize: '14px' }}>See you at the next one.</Text>
          <Text style={{ color: '#666', fontSize: '14px' }}>— George &amp; Cameron</Text>
        </Container>
      </Body>
    </Html>
  )
}
