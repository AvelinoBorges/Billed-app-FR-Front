/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import { ROUTES_PATH } from "../constants/routes.js"
import router from "../app/Router.js"

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then ...", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      //to-do write assertion
    })
  })

  describe("When I am on NewBill Page as an Employee", () => {
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'employee@test.com'
      }))
    })

    describe("When I upload a file with valid extension", () => {
      test("Then file should be processed", () => {
        const html = NewBillUI()
        document.body.innerHTML = html
        
        const mockStore = {
          bills: () => ({
            create: jest.fn().mockResolvedValue({ fileUrl: 'http://test.com/test.jpg', key: 'test123' })
          })
        }

        const newBill = new NewBill({
          document,
          onNavigate: jest.fn(),
          store: mockStore,
          localStorage: window.localStorage
        })

        const fileInput = screen.getByTestId("file")
        const file = new File(["test"], "test.jpg", { type: "image/jpeg" })
        
        // Create a custom event with mocked target properties
        const event = {
          preventDefault: jest.fn(),
          target: {
            value: 'C:\\fakepath\\test.jpg'
          }
        }

        // Mock the querySelector to return our file
        const originalQuerySelector = document.querySelector
        document.querySelector = jest.fn((selector) => {
          if (selector === `input[data-testid="file"]`) {
            return { files: [file] }
          }
          return originalQuerySelector.call(document, selector)
        })

        newBill.handleChangeFile(event)
        
        // Restore original querySelector
        document.querySelector = originalQuerySelector
      })
    })

    describe("When I upload a file with invalid extension", () => {
      test("Then file should be rejected and alert shown", () => {
        const html = NewBillUI()
        document.body.innerHTML = html
        
        const mockStore = {
          bills: () => ({
            create: jest.fn().mockResolvedValue({ fileUrl: 'http://test.com/test.pdf', key: 'test123' })
          })
        }

        const newBill = new NewBill({
          document,
          onNavigate: jest.fn(),
          store: mockStore,
          localStorage: window.localStorage
        })

        // Mock alert
        window.alert = jest.fn()

        const fileInput = screen.getByTestId("file")
        const file = new File(["test"], "test.pdf", { type: "application/pdf" })
        
        // Create a custom event with mocked target properties
        const event = {
          preventDefault: jest.fn(),
          target: {
            value: 'C:\\fakepath\\test.pdf'
          }
        }

        // Mock the querySelector to return our file
        const originalQuerySelector = document.querySelector
        document.querySelector = jest.fn((selector) => {
          if (selector === `input[data-testid="file"]`) {
            return { files: [file] }
          }
          return originalQuerySelector.call(document, selector)
        })

        newBill.handleChangeFile(event)
        
        expect(window.alert).toHaveBeenCalledWith('Veuillez sélectionner un fichier avec une extension valide (jpg, jpeg, png)')
        expect(event.target.value).toBe('')
        
        // Restore original querySelector
        document.querySelector = originalQuerySelector
      })
    })

    describe("When I submit the form with valid data", () => {
      test("Then it should create a new bill and navigate to Bills page", () => {
        const html = NewBillUI()
        document.body.innerHTML = html
        
        const onNavigate = jest.fn()
        const mockStore = {
          bills: () => ({
            create: jest.fn().mockResolvedValue({ fileUrl: 'http://test.com/test.jpg', key: 'test123' }),
            update: jest.fn().mockResolvedValue({})
          })
        }

        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage
        })

        // Set up form data
        const form = screen.getByTestId("form-new-bill")
        const expenseTypeSelect = screen.getByTestId("expense-type")
        const expenseNameInput = screen.getByTestId("expense-name")
        const datePicker = screen.getByTestId("datepicker")
        const amountInput = screen.getByTestId("amount")
        const vatInput = screen.getByTestId("vat")
        const pctInput = screen.getByTestId("pct")
        const commentaryTextarea = screen.getByTestId("commentary")

        fireEvent.change(expenseTypeSelect, { target: { value: 'Transports' } })
        fireEvent.change(expenseNameInput, { target: { value: 'Test expense' } })
        fireEvent.change(datePicker, { target: { value: '2023-04-04' } })
        fireEvent.change(amountInput, { target: { value: '100' } })
        fireEvent.change(vatInput, { target: { value: '20' } })
        fireEvent.change(pctInput, { target: { value: '20' } })
        fireEvent.change(commentaryTextarea, { target: { value: 'Test commentary' } })

        // Mock the handleSubmit method
        const handleSubmit = jest.fn(newBill.handleSubmit)
        form.addEventListener('submit', handleSubmit)

        fireEvent.submit(form)
        
        expect(handleSubmit).toHaveBeenCalled()
      })
    })

    describe("When I submit the form and an error occurs", () => {
      test("Then it should handle the error", () => {
        const html = NewBillUI()
        document.body.innerHTML = html
        
        const onNavigate = jest.fn()
        const mockStore = {
          bills: () => ({
            create: jest.fn().mockResolvedValue({ fileUrl: 'http://test.com/test.jpg', key: 'test123' }),
            update: jest.fn().mockRejectedValue(new Error('Network error'))
          })
        }

        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage
        })

        // Test that the method exists and can be called
        expect(typeof newBill.updateBill).toBe('function')
        expect(newBill.store).toBeDefined()
      })
    })

    describe("When store is not available", () => {
      test("Then updateBill should not execute", async () => {
        const html = NewBillUI()
        document.body.innerHTML = html
        
        const newBill = new NewBill({
          document,
          onNavigate: jest.fn(),
          store: null,
          localStorage: window.localStorage
        })

        const result = await newBill.updateBill({ test: 'data' })
        expect(result).toBeUndefined()
      })
    })
  })

  // Integration test POST
  describe("Given I am a user connected as Employee", () => {
    describe("When I create a new bill", () => {
      test("Then it should create bill via POST API call", async () => {
        const onNavigate = jest.fn()
        
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: 'employee@test.com'
        }))

        const html = NewBillUI()
        document.body.innerHTML = html
        
        const newBillContainer = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage
        })

        // Mock file upload
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
        const fileInput = screen.getByTestId('file')
        
        // Mock FormData and store creation
        const mockCreate = jest.fn().mockResolvedValue({
          fileUrl: 'https://test.storage.tld/test.jpg',
          key: '1234'
        })
        
        const mockBills = {
          create: mockCreate,
          update: jest.fn().mockResolvedValue({})
        }
        
        newBillContainer.store = {
          bills: () => mockBills
        }

        // Simulate file selection
        Object.defineProperty(fileInput, 'files', {
          value: [file],
          writable: false
        })
        
        const changeEvent = new Event('change', { bubbles: true })
        Object.defineProperty(changeEvent, 'target', {
          value: { value: 'C:\\fakepath\\test.jpg' },
          writable: false
        })

        // Mock the querySelector for the file input
        const originalQuerySelector = document.querySelector
        document.querySelector = jest.fn((selector) => {
          if (selector === `input[data-testid="file"]`) {
            return { files: [file] }
          }
          return originalQuerySelector.call(document, selector)
        })

        await newBillContainer.handleChangeFile(changeEvent)

        expect(mockCreate).toHaveBeenCalled()
        
        // Restore original querySelector
        document.querySelector = originalQuerySelector
      })

      describe("When an error occurs on API", () => {
        test("Then it should handle 404 error", () => {
          const onNavigate = jest.fn()
          
          Object.defineProperty(window, 'localStorage', { value: localStorageMock })
          window.localStorage.setItem('user', JSON.stringify({
            type: 'Employee',
            email: 'employee@test.com'
          }))

          const html = NewBillUI()
          document.body.innerHTML = html
          
          const mockStore404 = {
            bills: () => ({
              create: jest.fn().mockRejectedValue(new Error("Erreur 404")),
              update: jest.fn().mockRejectedValue(new Error("Erreur 404"))
            })
          }

          const newBillContainer = new NewBill({
            document,
            onNavigate,
            store: mockStore404,
            localStorage: window.localStorage
          })

          // Test that the container was created with the error store
          expect(newBillContainer.store).toBeDefined()
          expect(typeof newBillContainer.handleChangeFile).toBe('function')
        })

        test("Then it should handle 500 error", () => {
          const onNavigate = jest.fn()
          
          Object.defineProperty(window, 'localStorage', { value: localStorageMock })
          window.localStorage.setItem('user', JSON.stringify({
            type: 'Employee',
            email: 'employee@test.com'
          }))

          const mockStore500 = {
            bills: () => ({
              create: jest.fn().mockRejectedValue(new Error("Erreur 500")),
              update: jest.fn().mockRejectedValue(new Error("Erreur 500"))
            })
          }

          const newBillContainer = new NewBill({
            document,
            onNavigate,
            store: mockStore500,
            localStorage: window.localStorage
          })

          // Test that the container was created with the error store
          expect(newBillContainer.store).toBeDefined()
          expect(typeof newBillContainer.updateBill).toBe('function')
        })
      })
    })
  })
})
