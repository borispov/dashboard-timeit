const createEl          = el        => document.createElement(el)
const setAtt            = (att,v)   => el => el.setAttribute(att, v)
const addClass          = style     => el => el.classList.add(style)
const addClasses        = styles    => el => styles.map(style => addClass(style)(el))
const setHTML           = v         => el => el.innerHTML = v
const appChild          = par => child => par.appendChild(child)

const arrHead = ["Date", "Start", "End", "Notes"]
const csvraw = "a,b,c\na,b,c\nd,e,f\ng,h,i"

// SELECTORS
const recentRep   = document.getElementById("recent-reports")
const root        = document.getElementById("root")
const staffList   = document.getElementById("staffList")
const employeeRep = document.getElementById("emp-reports")
const staffMenu   = document.querySelector('[data-type="stafflist-menu"]')
const monthEl     = document.getElementById("month")


const local         = 'http://localhost:3030/'
const API_HOST      = 'https://nathan.rispov.com/report/'
const API_BY_MONTH  = month => API_HOST + month

// Month Selector Listener
monthEl.addEventListener("change", async function() {
  const { empFiles, employees } = await getCurrentMonthRepots()
  populateReports(empFiles)
})

// methods
async function getCurrentMonthRepots() {
  const response = await axios.get(API_HOST + monthEl.value);
  if (!response) {
    console.log('Unable to receive data')
    return
  }
  const data = {
    employees: [...new Set(response.data.data.map(a => a.employee_name.split(' ')[0]))],
    filenames: response.data.data.map(a => a.employee_name + '-' + a.client_name),
    empFiles: response.data.data,
    addedAt: new Date().getTime()
  }
  localStorage.setItem("data", JSON.stringify(data))
  return data
}

// get list of employees
async function getEmployeeList() {
  const localData = localStorage.getItem("data")
  return localData && localData.employees
}

// create table element.
function createTable(csvString) {
  const initTable = createEl('table')
  setAtt("id", "table-main")(initTable)
  addClasses(["table", "table-bordered","table-flush", "table-striped", "mt-5"])(initTable)
  const tr = initTable.insertRow(-1)
  // assign table headers
  arrHead.map((_, i) => {
    const th = createEl('th')
    R.juxt([
      appChild(tr),
      setHTML(arrHead[i]),
      addClasses(['text-white', 'bg-primary', 'table-th'])],
    )(th)
  })
  appChild(root)(initTable)

  csvString.split('\n').map((row, i) => {
    if (i === 0) { return }
    return createRow(row.split(','),'table-main')
  })
}

// create a row and seed it.
function createRow(rowData, tableEl) {
  const table   = document.getElementById(tableEl)
  const len     = table.rows.length
  const row     = table.insertRow(len)
  rowData.map((cell,i) => setHTML(cell)(row.insertCell(i)))
}

// createTable()
function clearTable(){
  const t = document.getElementById('table-main')
  if (t) root.removeChild(t)
}

function clearRecents (){
  // Ugly, Dirty Trick to remove all children.
  recentRep.innerHTML = ""
}


function populateReports (reports) {
  clearRecents()
  reports.map(file => {
    const li = createEl('li')
    const a  = createEl('a')
    setAtt("href", "#")(a)
    addClasses(['list-inline-item', 'px-2', 'w-25'])(li)
    setHTML(file.employee_name + '_' + file.patient_name)(a)
    li.appendChild(a)
    recentRep.appendChild(li)
    li.addEventListener('click', function() {
      clearTable()
      createTable(file.csv_string)
    }) 
  })
}

document.addEventListener("DOMContentLoaded", async function() {
  const { empFiles, employees } = await getCurrentMonthRepots()

  empFiles.map(file => {
    const li = createEl('li')
    const a  = createEl('a')
    setAtt("href", "#")(a)
    addClasses(['list-inline-item', 'px-2', 'w-25'])(li)
    setHTML(file.employee_name + '_' + file.client_name)(a)
    li.appendChild(a)
    recentRep.appendChild(li)
    li.addEventListener('click', function() {
      clearTable()
      createTable(file.csv_string)
    }) 
  })
  
  employees.map(employee => {
    const li = createEl('li')
    addClasses(['sidebar-nav-item','nav-item', 'px-2', 'text-secondary'])(li)
    setHTML(employee)(li)
    li.addEventListener('click', function() {
      individualReport(employee,empFiles)
    })
    staffMenu.appendChild(li)
  })
  
  

})

// toggle staff menu on hover
$("#staffList-trigger").hover(function () {
  $("#staffList").collapse('show')
})
$(".sidebar").mouseleave(function () {
  $("#staffList").collapse('hide')
})

// extract employee reports, transform into an object with following structure
// Object { client_name, data, month }
function getEmployeeData(employee, reports) {
  const empReports = reports.filter(report => report.employee_name.split(' ')[0] === employee)
  const transformed = empReports.map( ({ client_name, month, data}) => ({ client_name, month, data}))
  return 
}

// POPULATE Month Selection
function populateMonthSelection () {
}

// SHOW INDIVIDUAL EMPLOYEE REPORT
function individualReport (name, reports) {
  [...employeeRep.childNodes].map( a => a.remove())
  const data = getEmployeeData(name, reports)
  addClasses(['col-md-9', 'ml-sm-auto', 'col-lg-10', 'px-4', 'mt-4', 'mb-0', 'border-top-0'])(employeeRep)
  const divCard = createEl('div')
  const divBody = createEl('div')
  const title   = createEl('h5')
  addClasses(['card-title', 'font-weight-bold'])(title)
  addClasses(['card', 'border-0'])(divCard)
  addClasses(['card-body', 'p-0'])(divBody)
  setHTML(`דוחות עבור: ${name}`)(title)

  const list = createEl('ul')
  data.map(report => {
    const li   = createEl('li')
    addClasses(['list-inline'])(list)
    addClasses(['list-inline-item', 'py-2', 'report-list-item'])(li)
    setHTML(report.client_name + '-' + report.month)(li)
    list.appendChild(li)
    li.addEventListener('click', function() {
      clearTable()
      createTable(report.data)
    }) 
  })
  divCard.appendChild(divBody)
  divBody.appendChild(title)
  divBody.appendChild(list)
  employeeRep.appendChild(divCard)
}
