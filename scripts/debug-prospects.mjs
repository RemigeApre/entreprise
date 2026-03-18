const BASE_URL = process.env.DIRECTUS_URL || 'http://localhost:8055'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@legeai.fr'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

async function main() {
  // Login as admin
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  })
  const { data: { access_token: adminToken } } = await loginRes.json()
  const h = { Authorization: `Bearer ${adminToken}` }

  // Login as employe
  const empRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'employe@legeai.fr', password: 'Test1234!' })
  })
  const empData = await empRes.json()
  const empToken = empData.data?.access_token
  console.log('Employe login:', empToken ? '✓ OK' : '✗ FAILED: ' + JSON.stringify(empData.errors))

  if (empToken) {
    // Test prospects read as employe
    const testRes = await fetch(`${BASE_URL}/items/prospects?limit=1`, {
      headers: { Authorization: `Bearer ${empToken}` }
    })
    const testData = await testRes.json()
    console.log('Employe read prospects:', testRes.status, testData.errors?.[0]?.message || 'OK (' + testData.data?.length + ' items)')
  }

  // Check the user's role
  const meRes = await fetch(`${BASE_URL}/users/me?fields=id,email,role.id,role.name,role.admin_access,role.app_access`, {
    headers: empToken ? { Authorization: `Bearer ${empToken}` } : h
  })
  const meData = await meRes.json()
  console.log('User role:', JSON.stringify(meData.data?.role))

  // Check Base Authentifie policy permissions for prospects
  const policyRes = await fetch(`${BASE_URL}/policies?filter[name][_eq]=Base%20Authentifie&limit=1`, { headers: h })
  const policyData = await policyRes.json()
  const policy = policyData.data?.[0]
  console.log('Policy:', policy?.id, policy?.name)

  if (policy) {
    const permRes = await fetch(`${BASE_URL}/permissions?filter[policy][_eq]=${policy.id}&filter[collection][_eq]=prospects&fields=*`, { headers: h })
    const permData = await permRes.json()
    console.log('Prospects permissions:', JSON.stringify(permData.data, null, 2))

    // Check access links for Employe role
    const accessRes = await fetch(`${BASE_URL}/access?filter[policy][_eq]=${policy.id}&fields=*&limit=20`, { headers: h })
    const accessData = await accessRes.json()
    console.log('Access links count:', accessData.data?.length)
    console.log('Access links:', JSON.stringify(accessData.data?.map(a => ({ role: a.role, user: a.user }))))
  }
}

main().catch(console.error)
