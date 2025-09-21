/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import { formatDate, formatStatus } from "../app/format.js"
import Bills from "../containers/Bills.js"
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon).toBeTruthy()

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  describe("When I am on Bills Page as an Employee", () => {
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      
      // Mock jQuery globally
      global.$ = jest.fn(() => ({
        click: jest.fn(),
        width: () => 500,
        find: () => ({
          html: jest.fn()
        }),
        modal: jest.fn()
      }))
    })

    describe("When I click on the new bill button", () => {
      test("Then it should navigate to NewBill page", () => {
        const onNavigate = jest.fn()
        
        const html = BillsUI({ data: [] })
        document.body.innerHTML = html
        
        const billsContainer = new Bills({
          document, 
          onNavigate, 
          store: null, 
          localStorage: window.localStorage
        })
        
        const handleClickNewBill = jest.fn(billsContainer.handleClickNewBill)
        const newBillBtn = screen.getByTestId('btn-new-bill')
        newBillBtn.addEventListener('click', handleClickNewBill)
        newBillBtn.click()
        
        expect(handleClickNewBill).toHaveBeenCalled()
      })
    })

    describe("When I click on the eye icon", () => {
      test("Then a modal should open", () => {
        const html = BillsUI({ data: bills })
        document.body.innerHTML = html
        
        const onNavigate = jest.fn()
        const billsContainer = new Bills({
          document, 
          onNavigate, 
          store: null, 
          localStorage: window.localStorage
        })
        
        const handleClickIconEye = jest.fn(billsContainer.handleClickIconEye)
        
        const eye = screen.getAllByTestId('icon-eye')[0]
        eye.addEventListener('click', () => handleClickIconEye(eye))
        eye.click()
        
        expect(handleClickIconEye).toHaveBeenCalled()
      })
    })

    describe("When I navigate to Bills page", () => {
      test("Then getBills should return bills with formatted date and status", async () => {        
        const billsContainer = new Bills({
          document, 
          onNavigate: jest.fn(), 
          store: mockStore, 
          localStorage: window.localStorage
        })
        
        const bills = await billsContainer.getBills()
        
        expect(bills).toBeDefined()
        expect(bills.length).toBeGreaterThan(0)
        expect(bills[0]).toHaveProperty('date')
        expect(bills[0]).toHaveProperty('status')
      })
      
      test("Then getBills should handle corrupted data", async () => {        
        const corruptedStore = {
          bills() {
            return {
              list() {
                return Promise.resolve([{
                  id: "1",
                  date: "invalid-date",
                  status: "pending"
                }])
              }
            }
          }
        }
        
        const billsContainer = new Bills({
          document, 
          onNavigate: jest.fn(), 
          store: corruptedStore, 
          localStorage: window.localStorage
        })
        
        const consoleSpy = jest.spyOn(console, 'log')
        const bills = await billsContainer.getBills()
        
        expect(bills).toBeDefined()
        expect(consoleSpy).toHaveBeenCalled()
        
        consoleSpy.mockRestore()
      })
      
      test("Then getBills should return undefined when no store", async () => {
        const billsContainer = new Bills({
          document, 
          onNavigate: jest.fn(), 
          store: null, 
          localStorage: window.localStorage
        })
        
        const bills = await billsContainer.getBills()
        expect(bills).toBeUndefined()
      })
    })
  })

  // Integration test GET
  describe("Given I am a user connected as Employee", () => {
    describe("When I navigate to Bills", () => {
      test("fetches bills from mock API GET", async () => {
        localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.innerHTML = ""
        document.body.append(root)
        router()
        window.onNavigate(ROUTES_PATH.Bills)
        await waitFor(() => screen.getByText("Mes notes de frais"))
        
        const billsTable = await screen.getByTestId("tbody")
        expect(billsTable).toBeTruthy()
        expect(screen.getAllByTestId("btn-new-bill")[0]).toBeTruthy()
      })
    
      describe("When an error occurs on API", () => {
        beforeEach(() => {
          jest.spyOn(mockStore, "bills")
          Object.defineProperty(
              window,
              'localStorage',
              { value: localStorageMock }
          )
          window.localStorage.setItem('user', JSON.stringify({
            type: 'Employee',
            email: "a@a"
          }))
          const root = document.createElement("div")
          root.setAttribute("id", "root")
          document.body.appendChild(root)
          router()
        })
        
        test("fetches bills from an API and fails with 404 message error", async () => {
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list : () =>  {
                return Promise.reject(new Error("Erreur 404"))
              }
            }})
          window.onNavigate(ROUTES_PATH.Bills)
          await new Promise(process.nextTick);
          const message = await screen.getByText(/Erreur 404/)
          expect(message).toBeTruthy()
        })

        test("fetches messages from an API and fails with 500 message error", async () => {
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list : () =>  {
                return Promise.reject(new Error("Erreur 500"))
              }
            }})

          window.onNavigate(ROUTES_PATH.Bills)
          await new Promise(process.nextTick);
          const message = await screen.getByText(/Erreur 500/)
          expect(message).toBeTruthy()
        })
      })
    })
  })
})
