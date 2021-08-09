// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

/**
 * Similar to many popular logging packages, terminal providers support a range of message
 * severities. These severities have built-in formatting defaults in the Terminal object
 * (warnings are yellow, errors are red, etc.).
 *
 * Terminal providers may choose to suppress certain messages based on their severity,
 * or to route some messages to other providers or not based on severity.
 *
 *   Severity  | Purpose
 *   --------- | -------
 *   error     | Build errors and fatal issues in rush
 *   warning   | Not necessarily fatal, but indicate a problem the user should fix
 *   log       | Informational messages from the rush system
 *   verbose   | Additional information that may not always be necessary
 *   debug     | Highest detail level, best used for troubleshooting information
 *
 * @beta
 */
export enum TerminalProviderSeverity {
  log,
  warning,
  error,
  verbose,
  debug
}

/**
 * Implement the interface to create a terminal provider. Terminal providers
 * can be registered to a {@link Terminal} instance to receive messages.
 *
 * @beta
 */
export interface ITerminalProvider {
  /**
   * This property should return true only if the terminal provider supports
   * rendering console colors.
   */
  supportsColor: boolean;

  /**
   * This property should return the newline character the terminal provider
   * expects.
   */
  eolCharacter: string;

  /**
   * This function gets called on every terminal provider upon every
   * message function call on the terminal instance.
   *
   * @param data - The terminal message.
   * @param severity - The message severity. Terminal providers can
   * route different kinds of messages to different streams and may choose
   * to ignore verbose or debug messages.
   */
  write(data: string, severity: TerminalProviderSeverity): void;
}
