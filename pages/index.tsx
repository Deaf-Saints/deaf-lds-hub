import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>Hello World — Next.js + TypeScript</title>
        <meta name="description" content="Hello World app" />
      </Head>
      <main style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'Arial, sans-serif'}}>
        <h1>Hello, world!</h1>
        <p>Next.js + TypeScript app</p>
      </main>
    </>
  )
}
