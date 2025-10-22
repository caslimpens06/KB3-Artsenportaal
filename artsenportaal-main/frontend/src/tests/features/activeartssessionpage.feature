Feature: Active Arts Session Page

    Scenario: Displaying patient information
        Given I am on the Active Arts Session page
        Then I should see the patient name "Joep Doe"
        And I should see the patient age "10 jaar"
        And I should see the diagnosis "JDM (monocyclische)"
        And I should see the medication "x medicijn"
        And I should see the appointments count "4"

    Scenario: Clicking the radiology button
        Given I am on the Active Arts Session page
        When I click the radiology image button
        Then I should see an alert with the message "Radiology image clicked!"

    Scenario: Displaying blood chemistry data
        Given I am on the Active Arts Session page
        Then I should see a blood chemistry item with name "CK"
        And I should see the range "0 -145 U/L"
        And I should see the value "100"
    # herhaal dit uiteindelijk voor alle bloedwaarden

    Scenario: Session buttons are functional
        Given I am on the Active Arts Session page
        Then I should see a "Annuleer" button
        And I should see a "Sessie Toevoegen" button
        When I click the "Annuleer" button
        Then I should be navigated back to the previous page
        When I click the "Sessie Toevoegen" button
        Then the session should be added (or confirmation is shown)

    Scenario: Displaying scheduled appointment
        Given I am on the Active Arts Session page
        Then I should see the label "Gepland"
        And I should see the appointment date "02/06/2021"
