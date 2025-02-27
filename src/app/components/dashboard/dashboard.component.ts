import { Firestore, collection, setDoc, getDoc, doc, updateDoc, onSnapshot } from '@angular/fire/firestore';
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
  // Tooltip on hover
  tooltipVisible: boolean = false;
  tooltipText: string = '';
  tooltipX: number = 0;
  tooltipY: number = 0;
  // Input logic
  disableInput: boolean = false;
  maxNoteTextLength: number = 25;
  maxNoteLength: number = 5;
  // Week logic
  weeks: {
    week: number,
    dateRange: string,
    notes: {
      text: string,
      creator: string,
      voters: string[]
    }[],
    won: string
  }[] = [];
  currentText: string = '';
  currentWeek: number = 0;
  currentYear: number = 0;
  currentDay: number = 0;
  currentMonth: string = '';
  monthsInSlovak = [
    'januára', 'februára', 'marca', 'apríla', 'mája', 'júna', 'júla', 'augusta', 'septembra', 'októbra', 'novembra', 'decembra'
  ];
  // firebase logic
  auth: Auth = inject(Auth);
  email: string = this.auth.currentUser?.email ?? '';
  firestore: Firestore = inject(Firestore);
  collectionName: string = 'foodWeeks' // 'foodWeeksDev';

  constructor() {
    const currentDate = new Date();
    this.currentYear = currentDate.getFullYear();
    this.currentDay = currentDate.getDate();
    this.currentMonth = this.monthsInSlovak[currentDate.getMonth()];
    this.currentWeek = this.getWeekNumber(currentDate);
    this.generateWeeks(currentDate);
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
    // Listener on data changes
    onSnapshot(weeksRef, (querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const dbWeek = doc.data();
        const dbWeekString = dbWeek['week'].toString();
        const foundWeek = this.weeks.find(w => w.week.toString() + '-' + currentYear === dbWeekString);
        // if found a record
        if (foundWeek) {
          foundWeek.notes = dbWeek['notes'] || [];
          foundWeek.won = dbWeek['won'] || '';
        }
      });
    });
  }

  createNote(
    notes: {text: string, creator: string, voters: string[]}[],
    noteText: string,
    email: string
  ): {text: string, creator: string, voters: string[]} | null {
    // Validation for duplicate notes
    if (notes.some(n => n.text === noteText)) return null;
    // Validation for max limit of string
    if (noteText.length > this.maxNoteTextLength)
      noteText = noteText.slice(0, this.maxNoteTextLength);
    return {text: noteText, creator: email, voters: []}
  }

  // Add note to specific week
  async addNoteToWeek(weekNumber: number, noteText: string): Promise<void> {
    // Disable field while working
    this.disableInput = true;
    const week = this.weeks.find(w => w.week === weekNumber);
    // If notes are not at limit
    if (week && week.notes.length < this.maxNoteLength) {
      const newNote = this.createNote(week.notes, noteText, this.email);
      const backupNotes = Array.from(week.notes);
      if (newNote) week.notes.push(newNote);
      try {
        const weekRef: string = `${weekNumber.toString()}-${this.currentYear.toString()}`;
        // Put into firestore
        const weekDocRef = doc(this.firestore, this.collectionName, weekRef);
        // Check if the document exists
        const weekDocSnapshot = await getDoc(weekDocRef);
        // Document exists, so we update it
        if (weekDocSnapshot.exists()) {
          // throw new Error("Error");
          await updateDoc(weekDocRef, {
            notes: week.notes
          });
        // Document does not exist, create it with the note
        } else {
          await setDoc(weekDocRef, {
            week: weekRef,
            notes: [newNote],
            won: ''
          });
        }
        this.currentText = '';
      // Rollback if errors
      } catch(error: any) {
        week.notes = backupNotes;
        console.error(error);
      }
    }
    // Enable field after work is done
    this.disableInput = false;
  }

  // Remove note from a specific week
  async removeNoteFromWeek(weekNumber: number, noteText: string): Promise<void> {
    const week = this.weeks.find(w => w.week === weekNumber);
    if (week) {
      const backupNotes = Array.from(week.notes);
      // Remove from frontend view
      week.notes = week.notes.filter(note => note.text !== noteText);
      // Remove from firestore
      try {
        const weekDocRef = doc(this.firestore, this.collectionName, `${weekNumber.toString()}-${this.currentYear.toString()}`);
        await updateDoc(weekDocRef, {
          notes: week.notes
        });
      // Rollback if errors
      } catch (error: any) {
        week.notes = backupNotes;
        console.error(error);
      }
    }
  }

  // Vote for note from a specific week
  async voteForNoteFromWeek(weekNumber: number, note: {text: string, creator: string, voters: string[]} ): Promise<void> {
    const week = this.weeks.find(w => w.week === weekNumber);
    if (week) {
      const backupNotes = Array.from(week.notes);
      const userEmail = this.email;
      try {
        // Remove vote if already voted for this note
        if (note.voters.includes(userEmail)) note.voters = note.voters.filter(voter => voter !== userEmail);
        // Add note if user has not voted for this note yet
        else note.voters.push(userEmail);
        // Remove from firestore
        const weekDocRef = doc(this.firestore, this.collectionName, `${weekNumber.toString()}-${this.currentYear.toString()}`);
        await updateDoc(weekDocRef, {
          notes: week.notes
        });
      // Rollback if errors
      } catch (error: any) {
          week.notes = backupNotes;
          console.error(error);
      }
    }
  }

  // Set winner for note from a specific week
  async setWinNote(weekNumber: number, noteText: string): Promise<void> {
    const week = this.weeks.find(w => w.week === weekNumber);
    if (week) {
      const backupNoteWon = week.won.slice(0, week.won.length);
      try {
        week.won = noteText;
        // Update firestore record
        const weekDocRef = doc(this.firestore, this.collectionName, `${weekNumber.toString()}-${this.currentYear.toString()}`);
        await updateDoc(weekDocRef, {
          won: noteText
        });
      // Rollback if errors
      } catch (error: any) {
        week.won = backupNoteWon;
        console.error(error);
      }
    }
  }

  haveCreatedNote(creator: string): boolean {
    return this.email === creator;
  }

  haveVotedFor(note: {text: string, creator: string, voters: string[]}): boolean {
    return note.voters.includes(this.email);
  }

  showTooltip(event: MouseEvent, text: string, type: number = 0) {
    if (type === 1) // pre emaily (creator)
      this.tooltipText = 'vytvoril používateľ ' + text.slice(0, text.indexOf('@'));
    else if (type === 2)
      this.tooltipText = 'počet hlasov: ' + text;
    else // pre obycajne texty
      this.tooltipText = text;
    this.tooltipX = event.pageX + 10;
    this.tooltipY = event.pageY + 10;
    this.tooltipVisible = true;
  }

  hideTooltip() {
    this.tooltipVisible = false;
  }

}
