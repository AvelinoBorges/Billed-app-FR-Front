/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import {localStorageMock} from "../__mocks__/localStorage.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then ...", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      //to-do write assertion
    })
  })

  describe("When I upload a file with valid extension", () => {
    test("Then file should be processed", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'employee@test.com'
      }))

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
      
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'employee@test.com'
      }))

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
})
