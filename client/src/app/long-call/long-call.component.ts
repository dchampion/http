import { Component, OnInit } from '@angular/core';
import { LongCallService } from './long-call.service';
import { ISubscription } from 'rxjs/Subscription';
import { HttpErrorResponse } from '@angular/common/http';
import { TimerObservable } from 'rxjs/observable/TimerObservable';

@Component({
  selector: 'app-long-call',
  templateUrl: './long-call.component.html',
  providers: [LongCallService],
  styleUrls: ['./long-call.component.css']
})
export class LongCallComponent implements OnInit {

  taskStatus: string;
  httpStatusCode: number;

  body: string[];
  timeout: number;

  progress: string;

  private submitSubscription: ISubscription;
  private pollSubscription: ISubscription;
  private timerSubscription: ISubscription;

  constructor(private longCallService: LongCallService) {
  }

  ngOnInit() {
    this.timeout = 10;
    this.resetVars();
  }

  resetVars() {
    this.progress = '';
    this.httpStatusCode = -1;
    this.body = [];
  }

  onSubmit() {
    this.resetVars();
    this.submitSubscription = this.longCallService.submit({timeout: this.timeout}).subscribe(response => {
      this.submitSubscription.unsubscribe();

      this.httpStatusCode = response.status;
      this.taskStatus = response.headers.get('Task-Status');
      const taskId = response.headers.get('Task-Id');

      this.timerSubscription = TimerObservable.create(2000, 2000).subscribe(() => this.poll(taskId));
    },
    (error: HttpErrorResponse) => {
      this.httpStatusCode = error.status;
      this.taskStatus = error.headers.get('Task-Status');
      this.unsubscribe();
    });
  }

  onPollBadId() {
    this.resetVars();
    this.poll('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
  }

  poll(taskId: string) {
    this.pollSubscription = this.longCallService.poll(taskId).subscribe(response => {
      this.httpStatusCode = response.status;
      this.taskStatus = response.headers.get('Task-Status');
      if (this.taskStatus === 'pending') {
        this.progress += '.';
      } else {
        this.unsubscribe();

        if (this.taskStatus === 'complete') {
          this.body = response.body;
        }
        this.progress = '';
      }
    },
    (error: HttpErrorResponse) => {
      this.httpStatusCode = error.status;
      this.taskStatus = error.headers.get('Task-Status');
      this.unsubscribe();
      this.progress = '';
    });
  }

  unsubscribe() {
    this.timerSubscription.unsubscribe();
    this.pollSubscription.unsubscribe();
  }
}
