import { Firestore, collection, setDoc, getDoc, getDocs, doc, updateDoc } from '@angular/fire/firestore';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'dashboard',
  imports: [FormsModule, CommonModule],
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  weeks: { week: number, dateRange: string, notes: string[], won: string }[] = [];
  maxNoteLength: number = 4;
  currentText: string = '';
  currentWeek: number = 0;
  currentYear: number = 0;
  currentDay: number = 0;
  currentMonth: string = '';
  monthsInSlovak = [
    'januára', 'februára', 'marca', 'apríla', 'mája', 'júna', 'júla', 'augusta', 'septembra', 'októbra', 'novembra', 'decembra'
  ];
  auth: Auth = inject(Auth);
  email: string = this.auth.currentUser?.email ?? '';
  firestore: Firestore = inject(Firestore);
  collectionName: string = 'foodWeeks';

  constructor() {
    const currentDate = new Date();
    this.currentYear = currentDate.getFullYear();
    this.currentDay = currentDate.getDate();
    this.currentMonth = this.monthsInSlovak[currentDate.getMonth()];
    this.currentWeek = this.getWeekNumber(currentDate);
    this.generateWeeks(currentDate);
    console.log(this.email);
  }

  async ngOnInit() {
    await this.fetchNotes();
  }

  // Function to get the current week number
  getWeekNumber(date: Date): number {
    const startDate = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - startDate.getTime();
    const oneDay = 1000 * 3600 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return Math.ceil((dayOfYear + 1) / 7); // Calculate the week number
  }

  // Function to generate weeks in a year along with their date range
  generateWeeks(endDate: Date): void {
    const startDate = new Date(this.currentYear, 0, 1);
    // Adjust the start date to the first Monday of the year
    const dayOfWeek = startDate.getDay();
    const daysToMonday = (dayOfWeek === 0) ? 6 : (dayOfWeek - 1); // If Sunday (0), subtract 6 days, otherwise subtract dayOfWeek - 1
    startDate.setDate(startDate.getDate() - daysToMonday);
    let currentDate = startDate;
    let weekNumber = 1;
    // Calculate weeks in the given year
    while (currentDate <= endDate) {
      const weekStartDate = new Date(currentDate);
      const weekEndDate = new Date(currentDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6); // The last day of the week
      // Ensure the weekEndDate doesn't go beyond December 31st of the current year
      const lastDayOfYear = new Date(this.currentYear, 11, 31); // December 31st of the current year
      if (weekEndDate > lastDayOfYear) {
        weekEndDate.setDate(lastDayOfYear.getDate()); // Adjust the end date to December 31st if it exceeds
      }
      // Format the date range as a string (e.g., "Jan 1 - Jan 7")
      const dateRange = `${weekStartDate.toLocaleDateString('sk-SK', { month: 'short', day: 'numeric' })} - ${weekEndDate.toLocaleDateString('sk-SK', { month: 'short', day: 'numeric' })}`;
      this.weeks.push({ week: weekNumber, dateRange, notes: [], won: '' });
      // Move to the next week
      currentDate.setDate(currentDate.getDate() + 7);
      weekNumber++;
    }
  }


  // Fetch notes from Firestore for each week
  async fetchNotes(): Promise<void> {
    const currentYear = this.currentYear.toString();
    const weeksRef = collection(this.firestore, this.collectionName);
    const querySnapshot = await getDocs(weeksRef);
    querySnapshot.forEach((doc) => {
      const dbWeek = doc.data();
      const dbWeekString = dbWeek['week'].toString();
      const foundWeek = this.weeks.find(w => w.week.toString() + '-' + currentYear === dbWeekString);
      if (foundWeek) {
        foundWeek.notes = dbWeek['notes'] || [];
        foundWeek.won = dbWeek['won'] || '';
      }
    });
  }

  // Add note to specific week
  async addNoteToWeek(weekNumber: number, note: string): Promise<void> {
    const week = this.weeks.find(w => w.week === weekNumber);
    if (week && week.notes.length < this.maxNoteLength) {
      try {
        const weekRef: string = `${weekNumber.toString()}-${this.currentYear.toString()}`;
        // Put into firestore
        const weekDocRef = doc(this.firestore, this.collectionName, weekRef);
        // Check if the document exists
        const weekDocSnapshot = await getDoc(weekDocRef);
        // Document exists, so we update it
        if (weekDocSnapshot.exists()) {
          await updateDoc(weekDocRef, {
            notes: week.notes
          });
        // Document does not exist, create it with the note
        } else {
          await setDoc(weekDocRef, {
            week: weekRef,
            notes: [note],
            won: ''
          });
        }
        week.notes.push(note);
        this.currentText = '';
      } catch {

      }
    }
  }

  // Remove note from a specific week
  async removeNoteFromWeek(weekNumber: number, note: string): Promise<void> {
    const week = this.weeks.find(w => w.week === weekNumber);
    if (week) {
      week.notes = week.notes.filter(n => n !== note);
      // Remove from firestre
      const weekDocRef = doc(this.firestore, this.collectionName, `${weekNumber.toString()}-${this.currentYear.toString()}`);
      await updateDoc(weekDocRef, {
        notes: week.notes
      });
    }
  }
}
